import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Environment validation utilities
/**
 * Environment variable validation utility for Supabase Edge Functions
 */

// Required environment variables for all functions
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

// Function-specific required environment variables
const FUNCTION_SPECIFIC_ENV_VARS = {
  'generate-learning-plan': ['OPENAI_API_KEY'],
  'send-whatsapp': ['GUPSHUP_API_KEY'],
  'deliver-microlearnings': ['RESEND_API_KEY']
};

/**
 * Validates that all required environment variables are set
 * @param functionName Optional function name to check function-specific variables
 * @returns Object containing validation results
 */
const validateEnv = (functionName?: string): {
  valid: boolean;
  missing: string[];
  message: string;
} => {
  const missing: string[] = [];

  // Check common required variables
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (!Deno.env.get(envVar)) {
      missing.push(envVar);
    }
  });

  // Check function-specific variables if functionName is provided
  if (functionName && FUNCTION_SPECIFIC_ENV_VARS[functionName]) {
    FUNCTION_SPECIFIC_ENV_VARS[functionName].forEach(envVar => {
      if (!Deno.env.get(envVar)) {
        missing.push(envVar);
      }
    });
  }

  const valid = missing.length === 0;
  const message = valid
    ? 'All required environment variables are set'
    : `Missing required environment variables: ${missing.join(', ')}`;

  return { valid, missing, message };
};

/**
 * Gets an environment variable with validation and optional fallback
 * @param key Environment variable name
 * @param fallback Optional fallback value
 * @param required Whether the variable is required
 * @returns The environment variable value or fallback
 * @throws Error if required and not set
 */
const getEnv = (key: string, fallback?: string, required = true): string => {
  const value = Deno.env.get(key) || fallback;

  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }

  return value || '';
};

// Initialize Supabase client
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Gupshup API key
const gupshupApiKey = getEnv('GUPSHUP_API_KEY');

// Message types and their template mappings
const MESSAGE_TEMPLATES = {
  SUMMARY: 'daily_summary',
  QUIZ: 'quiz_question',
  FEEDBACK: 'feedback_request',
  PAUSE: 'course_paused',
  RESUME: 'course_resumed'
};

/**
 * Sends a WhatsApp message via Gupshup API
 * @param phoneNumber Recipient phone number
 * @param message Message content
 * @param messageType Type of message (for template selection)
 * @returns Response from Gupshup API
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string, messageType: string = 'SUMMARY') {
  try {
    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }

    // Remove any spaces or special characters
    phoneNumber = phoneNumber.replace(/\s+/g, '');

    // Determine if we should use a template
    const useTemplate = Object.keys(MESSAGE_TEMPLATES).includes(messageType);
    const templateName = useTemplate ? MESSAGE_TEMPLATES[messageType] : null;

    // Prepare request body
    const requestBody = useTemplate
      ? {
        channel: "whatsapp",
        source: "917834811114",
        destination: phoneNumber,
        "src.name": "DHIVAAI",
        message: {
          isHSM: "true",
          type: "text",
          text: message
        },
        template: {
          id: templateName,
          params: [message]
        }
      }
      : {
        channel: "whatsapp",
        source: "917834811114",
        destination: phoneNumber,
        "src.name": "DHIVAAI",
        message: {
          type: "text",
          text: message
        }
      };

    // Send request to Gupshup API
    const response = await fetch('https://api.gupshup.io/sm/api/v1/msg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': gupshupApiKey
      },
      body: JSON.stringify(requestBody)
    });

    // Parse response
    const responseData = await response.json();

    // Log message delivery
    await logMessageDelivery(phoneNumber, message, messageType, responseData.status === 'submitted');

    return responseData;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);

    // Log failed message delivery
    await logMessageDelivery(phoneNumber, message, messageType, false, error.message);

    throw error;
  }
}

/**
 * Logs message delivery status to database
 * @param phoneNumber Recipient phone number
 * @param message Message content
 * @param messageType Type of message
 * @param success Whether delivery was successful
 * @param errorMessage Optional error message
 */
async function logMessageDelivery(
  phoneNumber: string,
  message: string,
  messageType: string,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabase.from('message_logs').insert({
      phone_number: phoneNumber,
      message_type: messageType,
      message_content: message,
      success,
      error_message: errorMessage || null,
      sent_at: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Error logging message delivery:', logError);
  }
}

// Serve HTTP requests
serve(async (req) => {
  // Validate environment variables
  const validation = validateEnv('send-whatsapp');
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: validation.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const requestData = await req.json();
    const { phoneNumber, message, messageType } = requestData;

    // Validate required parameters
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: phoneNumber and message' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(phoneNumber, message, messageType);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
