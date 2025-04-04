import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import OpenAI from "https://esm.sh/openai@4.20.1";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Environment validation utilities
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
const validateEnv = (functionName?: string) : { 
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

// Initialize OpenAI client
const openaiApiKey = getEnv('OPENAI_API_KEY');
const openai = new OpenAI({
  apiKey: openaiApiKey
});

// Define types
interface LearningDay {
  day: number;
  title: string;
  description: string;
  microlearnings: Microlearning[];
}

interface Microlearning {
  type: 'summary' | 'quiz' | 'feedback' | 'challenge';
  content: string;
  options?: string[];
  correctAnswer?: string;
}

/**
 * Generates a learning plan for a course
 * @param courseId The course ID
 * @param audienceLevel The audience level (beginner, intermediate, advanced)
 * @returns The generated learning plan
 */
async function generateLearningPlan(courseId: string, audienceLevel: string): Promise<LearningDay[]> {
  try {
    // Validate environment variables
    const validation = validateEnv('generate-learning-plan');
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    // Get course information from database
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('title, description, topics, duration_days')
      .eq('id', courseId)
      .single();
    
    if (courseError) throw courseError;
    if (!courseData) throw new Error(`Course with ID ${courseId} not found`);
    
    // Prepare prompt for OpenAI
    const prompt = `
      Create a ${courseData.duration_days}-day learning plan for a course titled "${courseData.title}" 
      with the following description: "${courseData.description}".
      
      The course covers these topics: ${courseData.topics.join(', ')}.
      The audience level is: ${audienceLevel}.
      
      For each day, include:
      1. A title for the day's learning
      2. A brief description of what will be covered
      3. 2-3 microlearnings (short learning activities) which can be one of:
         - summary: A brief summary of key concepts
         - quiz: A multiple-choice question with 3-4 options
         - feedback: A prompt for learner reflection
         - challenge: A small practical exercise
      
      Format the response as a JSON array of learning day objects.
    `;
    
    // Generate learning plan with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an educational content designer creating structured learning plans." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Parse and validate the response
    try {
      const response = JSON.parse(completion.choices[0].message.content);
      const learningPlan = response.days || [];
      
      // Validate the structure
      if (!Array.isArray(learningPlan)) {
        throw new Error('Invalid learning plan format: not an array');
      }
      
      // Save the learning plan to the database
      const { data: planData, error: planError } = await supabase
        .from('learning_plans')
        .insert({
          course_id: courseId,
          audience_level: audienceLevel,
          plan: learningPlan
        })
        .select()
        .single();
      
      if (planError) throw planError;
      
      return learningPlan;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to generate a valid learning plan');
    }
  } catch (error) {
    console.error('Error in generateLearningPlan:', error);
    throw error;
  }
}

// Handle OPTIONS requests for CORS
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
}

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    // Validate environment variables
    const validation = validateEnv('generate-learning-plan');
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
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    
    // Parse request body
    const requestData = await req.json();
    const { courseId, audienceLevel } = requestData;
    
    // Validate required parameters
    if (!courseId || !audienceLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: courseId and audienceLevel' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Generate learning plan
    const learningPlan = await generateLearningPlan(courseId, audienceLevel);
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: learningPlan }),
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