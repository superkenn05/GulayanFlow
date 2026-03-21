
'use server';
/**
 * @fileOverview A flow to generate personalized order completion emails.
 *
 * - orderNotificationFlow - Generates email content for a completed order.
 * - OrderNotificationInput - Input containing order and customer details.
 * - OrderNotificationOutput - The generated email subject and body.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OrderNotificationInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  orderId: z.string().describe('The unique order ID.'),
  total: z.number().describe('The total order amount.'),
  items: z.array(z.string()).describe('List of item names in the order.'),
});
export type OrderNotificationInput = z.infer<typeof OrderNotificationInputSchema>;

const OrderNotificationOutputSchema = z.object({
  subject: z.string().describe('The email subject line.'),
  body: z.string().describe('The HTML or text content of the email body.'),
});
export type OrderNotificationOutput = z.infer<typeof OrderNotificationOutputSchema>;

export async function generateOrderEmail(input: OrderNotificationInput): Promise<OrderNotificationOutput> {
  return orderNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'orderNotificationPrompt',
  input: { schema: OrderNotificationInputSchema },
  output: { schema: OrderNotificationOutputSchema },
  prompt: `You are the friendly customer service agent for "Gemma's Gulayan".
A customer's order has just been marked as "Completed" and is ready for pickup or delivery.

Generate a warm, professional, and helpful email notification for:
Customer: {{{customerName}}}
Order ID: {{{orderId}}}
Total: ₱{{{total}}}
Items: {{#each items}}{{{this}}}, {{/each}}

Include details about the harvest quality and a "Thank you" for supporting local farmers.
Return a subject line and the email body.`,
});

const orderNotificationFlow = ai.defineFlow(
  {
    name: 'orderNotificationFlow',
    inputSchema: OrderNotificationInputSchema,
    outputSchema: OrderNotificationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
