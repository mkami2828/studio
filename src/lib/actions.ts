// src/lib/actions.ts
'use server';

import { z } from 'zod';
import { textToImage } from '@/ai/flows/text-to-image';
import { generateImageFromImage } from '@/ai/flows/image-to-image';
import { put } from '@vercel/blob';

const FormSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required.'),
  mode: z.enum(['text-to-image', 'image-to-image']),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  seed: z.coerce.number().optional(),
  image: z.string().optional(),
  model: z.string().optional(),
  nologo: z.coerce.boolean().optional(),
  private: z.coerce.boolean().optional(),
  enhance: z.coerce.boolean().optional(),
  safe: z.coerce.boolean().optional(),
});

export type ActionState = {
  imageUrl?: string | null;
  prompt?: string | null;
  error?: string | null;
};

export async function generateImageAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      error: firstError || 'Invalid input.',
    };
  }

  const { mode, prompt, width, height, seed, image, model, nologo, private: isPrivate, enhance, safe } = validatedFields.data;

  try {
    let result;
    if (mode === 'text-to-image') {
      result = await textToImage({ prompt, width, height, seed, model, nologo, private: isPrivate, enhance, safe });
    } else if (mode === 'image-to-image') {
      if (!image) {
        return { error: 'An image is required for image-to-image generation.' };
      }
      result = await generateImageFromImage({ prompt, image });
    } else {
      return { error: 'Invalid generation mode.' };
    }

    if (!result?.imageUrl) {
      throw new Error('Image generation failed: No image URL was returned.');
    }

    // Fetch the image from the external URL
    const imageResponse = await fetch(result.imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Failed to fetch the generated image. Status: ${imageResponse.status}`);
    }
    const imageBlob = await imageResponse.blob();

    // Upload to Vercel Blob
    const blob = await put(`images/arty-ai-${Date.now()}.png`, imageBlob, {
        access: 'public',
    });

    return { imageUrl: blob.url, prompt: prompt };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Generation Error:', errorMessage);
    return { error: errorMessage, prompt: prompt };
  }
}
