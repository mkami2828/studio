'use server';

/**
 * @fileOverview Flow to generate an image with a transparent background from a text prompt using the 'gptimage' model.
 *
 * - generateTransparentImage - A function that handles the transparent background image generation process.
 * - GenerateTransparentImageInput - The input type for the generateTransparentImage function.
 * - GenerateTransparentImageOutput - The return type for the generateTransparentImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTransparentImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the image from.'),
});
export type GenerateTransparentImageInput = z.infer<typeof GenerateTransparentImageInputSchema>;

const GenerateTransparentImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image with a transparent background.'),
});
export type GenerateTransparentImageOutput = z.infer<typeof GenerateTransparentImageOutputSchema>;

export async function generateTransparentImage(input: GenerateTransparentImageInput): Promise<GenerateTransparentImageOutput> {
  return generateTransparentImageFlow(input);
}

const generateTransparentImagePrompt = ai.definePrompt({
  name: 'generateTransparentImagePrompt',
  input: {schema: GenerateTransparentImageInputSchema},
  output: {schema: GenerateTransparentImageOutputSchema},
  prompt: `Generate an image with a transparent background based on the following prompt: {{{prompt}}}.`,
  config: {
    // Safety settings configuration
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateTransparentImageFlow = ai.defineFlow(
  {
    name: 'generateTransparentImageFlow',
    inputSchema: GenerateTransparentImageInputSchema,
    outputSchema: GenerateTransparentImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate transparent image.');
    }

    return {imageUrl: media.url};
  }
);
