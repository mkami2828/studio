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
  nologo: z.boolean().optional().describe('Disable the Pollinations logo overlay.'),
  private: z.boolean().optional().describe('Prevent the image from appearing in the public feed.'),
  enhance: z.boolean().optional().describe('Enhance the prompt using an LLM for more detail.'),
  safe: z.boolean().optional().describe('Strict NSFW filtering.'),
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
{{#if image}}Image: {{image}}{{/if}}
{{#if nologo}}No Logo: {{nologo}}{{/if}}
{{#if private}}Private: {{private}}{{/if}}
{{#if enhance}}Enhance: {{enhance}}{{/if}}
{{#if safe}}Safe: {{safe}}{{/if}}`,
});

const textToImageFlow = ai.defineFlow(
  {
    name: 'textToImageFlow',
    inputSchema: TextToImageInputSchema,
    outputSchema: TextToImageOutputSchema,
  },
  async input => {
    // Construct the Pollinations AI API URL
    const params = new URLSearchParams();

    if (input.width) {
      params.append('width', input.width.toString());
    }
    if (input.height) {
      params.append('height', input.height.toString());
    }
    if (input.seed) {
      params.append('seed', input.seed.toString());
    }
    if (input.model) {
      params.append('model', input.model);
    }
    if (input.transparent) {
      params.append('transparent', input.transparent.toString());
    }
    if (input.image) {
      params.append('image', input.image);
    }
    if (input.nologo) {
      params.append('nologo', input.nologo.toString());
    }
    if (input.private) {
      params.append('private', input.private.toString());
    }
    if (input.enhance) {
      params.append('enhance', input.enhance.toString());
    }
    if (input.safe) {
      params.append('safe', input.safe.toString());
    }
    
    const queryString = params.toString();
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}${queryString ? `?${queryString}` : ''}`;
    
    return {
      imageUrl: url,
    };
  }
);
