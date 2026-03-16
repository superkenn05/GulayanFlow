'use server';
/**
 * @fileOverview An AI agent that estimates nutritional values for fruits and vegetables.
 *
 * - getNutritionalValues - A function that handles the nutritional estimation process.
 * - NutritionalValuesInput - The input type for the function.
 * - NutritionalValuesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NutritionalValuesInputSchema = z.object({
  name: z.string().describe('The name of the fruit or vegetable.'),
  description: z.string().optional().describe('Optional description for better accuracy.'),
});
export type NutritionalValuesInput = z.infer<typeof NutritionalValuesInputSchema>;

const NutritionalValuesOutputSchema = z.object({
  calories: z.string().describe('Estimated calories per 100g (e.g., "18kcal").'),
  protein: z.string().describe('Estimated protein per 100g (e.g., "0.9g").'),
  carbs: z.string().describe('Estimated carbohydrates per 100g (e.g., "3.9g").'),
  fat: z.string().describe('Estimated fat per 100g (e.g., "0.2g").'),
});
export type NutritionalValuesOutput = z.infer<typeof NutritionalValuesOutputSchema>;

export async function getNutritionalValues(
  input: NutritionalValuesInput
): Promise<NutritionalValuesOutput> {
  return nutritionalValuesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nutritionalValuesPrompt',
  input: { schema: NutritionalValuesInputSchema },
  output: { schema: NutritionalValuesOutputSchema },
  prompt: `You are a nutrition expert specializing in fresh produce.
Estimate the standard nutritional values per 100g for the following item. 
Provide realistic averages found in common nutritional databases.

Product Name: {{{name}}}
Description: {{{description}}}

Return the values in the specified JSON format with units (kcal or g).`,
});

const nutritionalValuesFlow = ai.defineFlow(
  {
    name: 'nutritionalValuesFlow',
    inputSchema: NutritionalValuesInputSchema,
    outputSchema: NutritionalValuesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
