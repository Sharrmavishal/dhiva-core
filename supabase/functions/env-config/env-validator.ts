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
export const validateEnv = (functionName?: string): { 
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
export const getEnv = (key: string, fallback?: string, required = true): string => {
  const value = Deno.env.get(key) || fallback;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
};