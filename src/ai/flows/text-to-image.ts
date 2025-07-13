// src/ai/flows/text-to-image.ts
'use server';

/**
 * @fileOverview Image generation flow using Pollinations AI API.
 *
 * - textToImage - A function that generates an image based on a text prompt.
 * - TextToImageInput - The input type for the textToImage function.
 * - TextToImageOutput - The return type for the textToImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextToImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
  width: z.number().optional().describe('The width of the image.'),
  height: z.number().optional().describe('The height of the image.'),
  seed: z.number().optional().describe('The seed for the image generation.'),
  model: z.string().optional().describe('The model to use for image generation.'),
  transparent: z.boolean().optional().describe('Whether to generate a transparent background (gptimage model only).'),
  image: z.string().optional().describe('Image URL for image-to-image generation (kontext model only).'),
});

export type TextToImageInput = z.infer<typeof TextToImageInputSchema>;

const TextToImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});

export type TextToImageOutput = z.infer<typeof TextToImageOutputSchema>;

export async function textToImage(input: TextToImageInput): Promise<TextToImageOutput> {
  return textToImageFlow(input);
}

const textToImagePrompt = ai.definePrompt({
  name: 'textToImagePrompt',
  input: {schema: TextToImageInputSchema},
  output: {schema: TextToImageOutputSchema},
  prompt: `Generate an image based on the following prompt:
{{prompt}}

Parameters:
{{#if width}}Width: {{width}}{{/if}}
{{#if height}}Height: {{height}}{{/if}}
{{#if seed}}Seed: {{seed}}{{/if}}
{{#if model}}Model: {{model}}{{/if}}
{{#if transparent}}Transparent: {{transparent}}{{/if}}
{{#if image}}Image: {{image}}{{/if}}`,
});

const textToImageFlow = ai.defineFlow(
  {
    name: 'textToImageFlow',
    inputSchema: TextToImageInputSchema,
    outputSchema: TextToImageOutputSchema,
  },
  async input => {
    // Construct the Pollinations AI API URL
    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}`;

    if (input.width) {
      url += `&width=${input.width}`;
    }
    if (input.height) {
      url += `&height=${input.height}`;
    }
    if (input.seed) {
      url += `&seed=${input.seed}`;
    }
    if (input.model) {
      url += `&model=${input.model}`;
    }
    if (input.transparent) {
      url += `&transparent=${input.transparent}`;
    }
    if (input.image) {
      url += `&image=${input.image}`;
    }

    return {
      imageUrl: url,
    };
  }
);
