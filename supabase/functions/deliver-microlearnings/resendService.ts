import { Resend } from "https://esm.sh/resend"; // ✅ ESM-compliant import for Edge Functions

const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: EmailPayload) => {
  try {
    const response = await resend.emails.send({
      from: from || 'dhiva@resend.dev', // fallback default
      to,
      subject,
      html,
    });

    return { data: response, error: null };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return { data: null, error };
  }
};
