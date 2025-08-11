'use server';

/**
 * @fileOverview A flow that generates lorem ipsum text for the hero section.
 *
 * - generateLoremIpsum - A function that generates lorem ipsum text.
 * - GenerateLoremIpsumInput - The input type for the generateLoremIpsum function.
 * - GenerateLoremIpsumOutput - The return type for the generateLoremIpsum function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLoremIpsumInputSchema = z.object({
  titleLength: z
    .number()
    .default(5)
    .describe('The number of words to generate for the title.'),
  descriptionLength: z
    .number()
    .default(20)
    .describe('The number of words to generate for the description.'),
});
export type GenerateLoremIpsumInput = z.infer<typeof GenerateLoremIpsumInputSchema>;

const GenerateLoremIpsumOutputSchema = z.object({
  title: z.string().describe('The generated lorem ipsum title.'),
  description: z.string().describe('The generated lorem ipsum description.'),
});
export type GenerateLoremIpsumOutput = z.infer<typeof GenerateLoremIpsumOutputSchema>;

export async function generateLoremIpsum(
  input: GenerateLoremIpsumInput
): Promise<GenerateLoremIpsumOutput> {
  return generateLoremIpsumFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLoremIpsumPrompt',
  input: {schema: GenerateLoremIpsumInputSchema},
  output: {schema: GenerateLoremIpsumOutputSchema},
  prompt: `You are a lorem ipsum text generator. Generate a title with {{titleLength}} words and a description with {{descriptionLength}} words.\n\nOutput should be a JSON object with a \"title\" and a \"description\" field.\n\nExample:\n{\n  \"title\": \"Lorem ipsum dolor sit amet\",\n  \"description\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.\"\n}`,
});

const generateLoremIpsumFlow = ai.defineFlow(
  {
    name: 'generateLoremIpsumFlow',
    inputSchema: GenerateLoremIpsumInputSchema,
    outputSchema: GenerateLoremIpsumOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
