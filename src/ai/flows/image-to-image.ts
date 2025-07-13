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
import { textToImage } from './text-to-image';

const ImageToImageInputSchema = z.object({
  prompt: z.string().describe('Text prompt to guide the image generation.'),
  image: z
    .string()
    .describe(
      "The input image to use as a base, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
  async ({ prompt, image }) => {
    // The kontext model requires the image URL and prompt to be part of the main prompt.
    // We will use the more generic textToImage flow to handle this.
    const result = await textToImage({
      prompt: `${image} ${prompt}`,
      model: 'kontext',
    });

    return { imageUrl: result.imageUrl };
  }
);
