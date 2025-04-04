import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@3.2.0';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
});

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface MicrolearningRequest {
  topicId: string;
  userId: string;
  topic: string;
  competencyLevel: string;
  pdfContent?: string;
  sourceType: 'pdf' | 'user_input' | 'org_upload' | 'ai_only';
}

interface Microlearning {
  type: 'summary' | 'quiz' | 'poll' | 'challenge';
  content: string;
  dayNumber: number;
  confidenceScore: number;
}

function estimateConfidence(content: string, type: string): number {
  // Simple heuristic-based confidence scoring
  let score = 0.5; // Base score

  // Length-based scoring
  const words = content.split(/\s+/).length;
  if (words > 100) score += 0.1;
  if (words > 200) score += 0.1;

  // Structure-based scoring
  if (type === 'quiz' && content.includes('?')) score += 0.1;
  if (type === 'summary' && content.includes('\n')) score += 0.1;
  
  // Clarity indicators
  if (content.includes('example') || content.includes('instance')) score += 0.1;
  if (content.includes('specifically') || content.includes('precisely')) score += 0.1;

  // Uncertainty indicators
  if (content.includes('might') || content.includes('maybe')) score -= 0.1;
  if (content.includes('possibly') || content.includes('perhaps')) score -= 0.1;

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

async function generateMicrolearnings(
  topic: string,
  level: string,
  sourceType: 'pdf' | 'user_input' | 'org_upload' | 'ai_only',
  pdfContent?: string
): Promise<Microlearning[]> {
  const prompt = `Act as a microlearning content designer. For the topic "${topic}", 
    and a learner at ${level} level, generate 5 microlearnings each under 300 words. 
    Mix formats like summaries, quizzes, polls, and open-ended challenges. 
    Keep tone engaging and clear. Avoid duplication.
    ${pdfContent ? `Use this content as reference: ${pdfContent}` : ''}
    
    Format the response as a JSON array with objects containing:
    - type: "summary" | "quiz" | "poll" | "challenge"
    - content: the actual content
    - dayNumber: sequential number starting from 1`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert microlearning content designer. Create engaging, concise, and effective learning content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No content received from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content);
    
    // Add confidence scores
    return response.microlearnings.map((ml: Microlearning) => ({
      ...ml,
      confidenceScore: estimateConfidence(ml.content, ml.type),
    }));
  } catch (error) {
    console.error('Error generating microlearnings:', error);
    throw new Error('Failed to generate microlearnings content');
  }
}

async function scheduleMicrolearnings(userId: string, topicId: string, microlearnings: Microlearning[]) {
  // Get user preferences
  const { data: preferences } = await supabase
    .from('preferences')
    .select('*')
    .eq('id', userId)
    .single();

  if (!preferences) {
    throw new Error('User preferences not found');
  }

  const now = new Date();
  const scheduledLearnings = microlearnings.map((learning, index) => {
    // Calculate scheduled date based on preferences
    const scheduledDate = new Date(now);
    
    if (preferences.frequency === 'daily') {
      scheduledDate.setDate(scheduledDate.getDate() + index);
    } else if (preferences.frequency === 'alternate') {
      scheduledDate.setDate(scheduledDate.getDate() + (index * 2));
    } else if (preferences.frequency === 'custom') {
      // Find the next available day from custom_days
      let daysToAdd = 0;
      let currentDay = now.getDay();
      let daysFound = 0;
      
      while (daysFound <= index) {
        currentDay = (currentDay + 1) % 7;
        const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][currentDay];
        
        if (preferences.custom_days.includes(dayName)) {
          daysFound++;
        }
        daysToAdd++;
      }
      
      scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
    }
    
    // Set the time of day
    const [hours, minutes] = {
      'morning': ['08', '00'],
      'afternoon': ['14', '00'],
      'evening': ['19', '00'],
    }[preferences.time_of_day] || ['08', '00'];
    
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return {
      topic_id: topicId,
      day_number: learning.dayNumber,
      type: learning.type,
      content: learning.content,
      scheduled_for: scheduledDate.toISOString(),
      source_type: 'ai_only',
      generated_by: 'openai',
      confidence_score: learning.confidenceScore,
    };
  });

  // Insert into microlearnings table
  const { error } = await supabase
    .from('microlearnings')
    .insert(scheduledLearnings);

  if (error) throw error;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId, userId, topic, competencyLevel, pdfContent, sourceType }: MicrolearningRequest = await req.json();

    // Generate microlearnings with confidence scores
    const microlearnings = await generateMicrolearnings(topic, competencyLevel, sourceType, pdfContent);

    // Schedule microlearnings
    await scheduleMicrolearnings(userId, topicId, microlearnings);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in generate-microlearnings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});