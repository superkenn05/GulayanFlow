
'use server';

/**
 * @fileOverview Server action to securely send order completion emails via EmailJS.
 * This keeps API keys and template IDs on the server.
 */

export async function sendOrderEmailAction(params: {
  customer_name: string;
  order_id: string;
  order_date: string;
  total_amount: string;
  order_items: string;
  to_email: string;
}) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error("Missing EmailJS configuration in environment variables.");
    throw new Error("Email service is not configured.");
  }

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      ...params,
      // Mapping additional fields seen in the screenshot
      title: `Order Completed: ${params.order_id}`,
      name: "Gemma's Gulayan Team 🌿",
      email: "support@gulayan.ph", // Default reply-to
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API Error: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email via EmailJS:", error);
    throw error;
  }
}
