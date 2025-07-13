// src/lib/actions.ts
'use server';

import { z } from 'zod';
import { textToImage } from '@/ai/flows/text-to-image';
import { generateImageFromImage } from '@/ai/flows/image-to-image';
import { generateTransparentImage } from '@/ai/flows/transparent-background-image';


const FormSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required.'),
  mode: z.enum(['text-to-image', 'image-to-image', 'transparent-bg']),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  seed: z.coerce.number().optional(),
  image: z.string().optional(),
});

export type ActionState = {
  imageUrl?: string | null;
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

  const { mode, prompt, width, height, seed, image } = validatedFields.data;

  try {
    let result;
    if (mode === 'text-to-image') {
      result = await textToImage({ prompt, width, height, seed });
    } else if (mode === 'image-to-image') {
      if (!image) {
        return { error: 'An image is required for image-to-image generation.' };
      }
      result = await generateImageFromImage({ prompt, image });
    } else if (mode === 'transparent-bg') {
      result = await generateTransparentImage({ prompt });
    } else {
      return { error: 'Invalid generation mode.' };
    }

    if (!result?.imageUrl) {
      throw new Error('Image generation failed: No image URL was returned.');
    }

    return { imageUrl: result.imageUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Generation Error:', errorMessage);
    return { error: errorMessage };
  }
}
