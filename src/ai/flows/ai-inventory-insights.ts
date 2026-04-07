/**
 * @fileOverview An AI agent that provides inventory insights based on current stock and transaction history.
 *
 * - aiInventoryInsights - A function that handles the AI inventory insights process.
 * - AIInventoryInsightsInput - The input type for the aiInventoryInsights function.
 * - AIInventoryInsightsOutput - The return type for the aiInventoryInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIInventoryInsightsInputSchema = z.object({
  currentInventory: z
    .array(
      z.object({
        productId: z.string().describe('Unique identifier for the product.'),
        name: z.string().describe('Name of the product.'),
        category: z.string().describe('Category of the product (e.g., Vegetables, Fruits).'),
        currentStock: z.number().int().describe('Current quantity of the product in stock.'),
        price: z.number().describe('Price per unit or kg of the product.'),
      })
    )
    .describe('Current inventory data including product details and stock levels.'),
  transactionHistory: z
    .array(
      z.object({
        productId: z.string().describe('Unique identifier for the product.'),
        quantitySold: z.number().int().describe('Quantity of the product sold in this transaction.'),
        date: z.string().datetime().describe('Date and time of the transaction in ISO format.'),
      })
    )
    .describe('Historical sales transaction data.'),
});
export type AIInventoryInsightsInput = z.infer<typeof AIInventoryInsightsInputSchema>;

const AIInventoryInsightsOutputSchema = z.object({
  marketInsights: z.string().describe('Actionable market insights and trends based on the data.'),
  bestSellingProducts: z
    .array(
      z.object({
        productId: z.string().describe('Unique identifier for the best-selling product.'),
        name: z.string().describe('Name of the best-selling product.'),
        salesVolume: z.number().int().describe('Total quantity sold for this product.'),
      })
    )
    .describe('List of best-selling products identified from the transaction history.'),
  optimalStockSuggestions: z
    .array(
      z.object({
        productId: z.string().describe('Unique identifier for the product.'),
        name: z.string().describe('Name of the product.'),
        suggestedOptimalStock: z.number().int().describe('Suggested optimal stock level for the product.'),
        reasoning: z.string().describe('Reasoning behind the suggested optimal stock level.'),
      })
    )
    .describe('Suggestions for optimal stock levels for various products.'),
});
export type AIInventoryInsightsOutput = z.infer<typeof AIInventoryInsightsOutputSchema>;

export async function aiInventoryInsights(
  input: AIInventoryInsightsInput
): Promise<AIInventoryInsightsOutput> {
  return aiInventoryInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInventoryInsightsPrompt',
  input: {schema: AIInventoryInsightsInputSchema},
  output: {schema: AIInventoryInsightsOutputSchema},
  prompt: `You are an AI-powered inventory management assistant for "Gemma's Gulayan", a vegetable and fruit store.
Your task is to analyze the provided current inventory and transaction history data to generate actionable market insights, identify best-selling products, and suggest optimal stock levels.

Here is the current inventory data:
{{{json currentInventory}}}

Here is the transaction history data:
{{{json transactionHistory}}}

Based on the data, please provide:
1.  **Market Insights**: A concise summary of market trends, popular product categories, or any other actionable insights that can help the store manager make purchasing decisions.
2.  **Best-Selling Products**: A list of products that have the highest sales volume. Only include products that appear in the transaction history.
3.  **Optimal Stock Suggestions**: For each product in the current inventory, suggest an optimal stock level, considering its sales history and current stock. Provide a brief reasoning for each suggestion.

Please ensure your output is in the specified JSON format.
`,
});

const aiInventoryInsightsFlow = ai.defineFlow(
  {
    name: 'aiInventoryInsightsFlow',
    inputSchema: AIInventoryInsightsInputSchema,
    outputSchema: AIInventoryInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
