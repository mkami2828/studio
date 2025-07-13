'use server';

/**
 * @fileOverview AI agent for image-to-image generation using the Pollinations AI API.
 *
 * - generateImageFromImage - A function that handles the image-to-image generation process.
 * - ImageToImageInput - The input type for the generateImageFromImage function.
 * - ImageToImageOutput - The return type for the generateImageFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToImageInputSchema = z.object({
  prompt: z.string().describe('Text prompt to guide the image generation.'),
  image: z
    .string()
    .describe(
      "The input image to use as a base, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToImageInput = z.infer<typeof ImageToImageInputSchema>;

const ImageToImageOutputSchema = z.object({
  imageUrl: z.string().describe('URL of the generated image.'),
});
export type ImageToImageOutput = z.infer<typeof ImageToImageOutputSchema>;

export async function generateImageFromImage(input: ImageToImageInput): Promise<ImageToImageOutput> {
  return imageToImageFlow(input);
}

const imageToImageFlow = ai.defineFlow(
  {
    name: 'imageToImageFlow',
    inputSchema: ImageToImageInputSchema,
    outputSchema: ImageToImageOutputSchema,
  },
  async input => {
    // The prompt for image-to-image with the kontext model is a bit different.
    // The prompt itself should contain the image URL.
    const fullPrompt = `${input.image} ${input.prompt}`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=kontext`;

    // To ensure the URL is fresh and avoids caching issues.
    const finalUrl = `${imageUrl}&seed=${Math.floor(Math.random() * 1000000)}`;
    
    return {imageUrl: finalUrl};
  }
);