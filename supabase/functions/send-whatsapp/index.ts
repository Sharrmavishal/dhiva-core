// send-whatsapp.ts
// Implements WhatsApp message delivery using Gupshup API

// Get environment variables
const GUPSHUP_API_KEY = Deno.env.get('GUPSHUP_API_KEY') || '';

// Interface for WhatsApp sending result
export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message using Gupshup API
 * @param phoneNumber - Recipient's phone number (with country code)
 * @param content - Formatted message content
 * @returns Result object with success status and error if applicable
 */
export async function sendWhatsAppMessage(phoneNumber: string, content: string): Promise<WhatsAppResult> {
  try {
    console.log(`Attempting WhatsApp delivery to: ${phoneNumber}`);
    
    if (!GUPSHUP_API_KEY) {
      throw new Error('GUPSHUP_API_KEY environment variable is not set');
    }
    
    // Ensure phone number is properly formatted (should include country code)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Prepare request to Gupshup API
    const response = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': GUPSHUP_API_KEY
      },
      body: new URLSearchParams({
        channel: 'whatsapp',
        source: '917834811114', // Replace with your WhatsApp business number
        destination: formattedPhone,
        message: JSON.stringify({
          type: 'text',
          text: content
        }),
        'src.name': 'DHIVAAI'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status !== 'submitted') {
      console.error('Gupshup API error:', data);
      return {
        success: false,
        error: data.message || `Gupshup API error: ${response.status}`
      };
    }
    
    console.log(`WhatsApp delivery successful to: ${phoneNumber}`, { messageId: data.messageId });
    
    return {
      success: true,
      messageId: data.messageId
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Unknown error sending WhatsApp message'
    };
  }
}

/**
 * Format phone number to ensure it has country code
 * @param phoneNumber - Input phone number
 * @returns Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If number doesn't start with country code, add default (India +91)
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  
  // If number already has country code, return as is
  return digitsOnly;
}
