// send-email.ts
// Implements email fallback delivery using Resend API

// Get environment variables
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL_ADDRESS = Deno.env.get('FROM_EMAIL_ADDRESS') || 'no-reply@dhiva.ai';

// Interface for email sending parameters
export interface EmailParams {
  to: string;
  subject: string;
  content: string;
  from?: string;
}

// Interface for email sending result
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using Resend API as fallback delivery method
 */
export async function sendEmailFallback(params: EmailParams): Promise<EmailResult> {
  try {
    console.log(`Attempting email fallback delivery to: ${params.to}`);
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: params.from || FROM_EMAIL_ADDRESS,
        to: params.to,
        subject: params.subject,
        html: params.content
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return {
        success: false,
        error: data.message || `Resend API error: ${response.status}`
      };
    }
    
    console.log(`Email fallback delivery successful to: ${params.to}`, { messageId: data.id });
    
    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error('Error sending email fallback:', error);
    return {
      success: false,
      error: error.message || 'Unknown error sending email'
    };
  }
}
