// Required environment variables for all functions
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

// Function-specific required environment variables
const FUNCTION_SPECIFIC_ENV_VARS: Record<string, string[]> = {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const functionName = url.searchParams.get('function');
    const validation = validateEnv(functionName || undefined);
    
    return new Response(
      JSON.stringify(validation),
      {
        status: validation.valid ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
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