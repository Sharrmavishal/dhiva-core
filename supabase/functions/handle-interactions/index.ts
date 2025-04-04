import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Initialize Supabase client with anon key for public access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add +91 prefix if not present
  if (!digits.startsWith('91')) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

interface LearnerProfile {
  id: string;
  user_id: string;
  course_id: string;
  onboarding_step: string;
  delivery_preference?: 'whatsapp' | 'email' | 'both';
}

async function getUserByPhone(phone: string) {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (error) throw error;
  return data;
}

async function getLearnerProfile(userId: string, courseId: string): Promise<LearnerProfile | null> {
  const { data, error } = await supabase
    .from('learner_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error) {
    console.error('Error fetching learner profile:', error);
    return null;
  }

  return data;
}

async function updateLearnerProfile(userId: string, courseId: string, updates: Partial<LearnerProfile>) {
  const { error } = await supabase
    .from('learner_profiles')
    .update(updates)
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) throw error;
}

async function sendWhatsAppResponse(phone: string, message: string, command?: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: phone,
      message,
      command,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send WhatsApp response');
  }
}

async function handleDeliveryPreference(phone: string, message: string, profile: LearnerProfile) {
  let preference: 'whatsapp' | 'email' | 'both' | null = null;
  const lowerMessage = message.toLowerCase().trim();

  // Parse delivery preference from message
  if (lowerMessage === '1' || lowerMessage.includes('whatsapp')) {
    preference = 'whatsapp';
  } else if (lowerMessage === '2' || lowerMessage.includes('email')) {
    preference = 'email';
  } else if (lowerMessage === '3' || lowerMessage.includes('both')) {
    preference = 'both';
  }

  if (preference) {
    // Update learner profile with preference
    await updateLearnerProfile(profile.user_id, profile.course_id, {
      delivery_preference: preference,
      onboarding_step: 'schedule_preference' // Move to next step
    });

    // Send confirmation
    const preferenceText = preference === 'both' ? 'both WhatsApp and Email' : `${preference} only`;
    await sendWhatsAppResponse(
      phone,
      `Perfect! You'll receive your lessons via ${preferenceText}.\n\nNow, let's set up your learning schedule...`
    );
  } else {
    // Invalid input, prompt again
    await sendWhatsAppResponse(
      phone,
      "I didn't quite catch that. Please choose how you'd like to receive your lessons:\n\n" +
      "1️⃣ WhatsApp only\n" +
      "2️⃣ Email only\n" +
      "3️⃣ Both WhatsApp and Email"
    );
  }
}

async function handlePause(phone: string) {
  const user = await getUserByPhone(phone);
  
  await supabase
    .from('preferences')
    .update({ status: 'paused' })
    .eq('id', user.id);

  return '✅ Your learning is paused. Text RESUME to continue.';
}

async function handleResume(phone: string) {
  const user = await getUserByPhone(phone);
  
  await supabase
    .from('preferences')
    .update({ status: 'active' })
    .eq('id', user.id);

  return '🎯 You\'re back on track! Lessons will resume as per your schedule.';
}

async function handleSummary(phone: string) {
  const user = await getUserByPhone(phone);
  
  const { data: microlearnings } = await supabase
    .from('microlearnings')
    .select(`
      *,
      topics (name)
    `)
    .eq('topics.user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(3);

  if (!microlearnings?.length) {
    return 'No recent lessons found.';
  }

  const summary = microlearnings
    .map((ml, index) => `${index + 1}. ${ml.content.substring(0, 50)}...`)
    .join('\n');

  return `📚 Your recent lessons:\n${summary}`;
}

async function handleFeedback(phone: string, rating: number) {
  if (rating < 1 || rating > 5) {
    return 'Please rate between 1 and 5.';
  }

  const user = await getUserByPhone(phone);
  
  // Get the most recent topic for this user
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      topic_id: topic.id,
      rating,
    });

  return '🙏 Thanks for your feedback!';
}

async function handleNextTopic() {
  return '🧠 New topic selection coming soon. Stay tuned!';
}

async function processCommand(phone: string, message: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  
  try {
    // Get user and active course
    const user = await getUserByPhone(normalizedPhone);
    if (!user) {
      return 'Sorry, I couldn\'t find your profile. Please start over.';
    }

    // Get latest course and learner profile
    const { data: latestCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestCourse) {
      return 'No active course found. Please start a new course.';
    }

    const profile = await getLearnerProfile(user.id, latestCourse.id);
    if (!profile) {
      return 'Profile not found. Please start over.';
    }

    // Handle onboarding steps
    if (profile.onboarding_step === 'delivery_preference') {
      await handleDeliveryPreference(normalizedPhone, message, profile);
      return;
    }

    // Handle standard commands
    const upperCommand = message.toUpperCase();
    let response: string;
    
    switch (upperCommand) {
      case 'PAUSE':
        response = await handlePause(normalizedPhone);
        await sendWhatsAppResponse(normalizedPhone, response, 'PAUSE');
        break;
      
      case 'RESUME':
        response = await handleResume(normalizedPhone);
        await sendWhatsAppResponse(normalizedPhone, response, 'RESUME');
        break;
      
      case 'SUMMARY':
        response = await handleSummary(normalizedPhone);
        await sendWhatsAppResponse(normalizedPhone, response, 'SUMMARY');
        break;
      
      case 'NEXT_TOPIC':
        response = await handleNextTopic();
        await sendWhatsAppResponse(normalizedPhone, response);
        break;
      
      default:
        // Check for feedback command
        if (upperCommand.startsWith('FEEDBACK ')) {
          const rating = parseInt(message.split(' ')[1]);
          response = await handleFeedback(normalizedPhone, rating);
          await sendWhatsAppResponse(normalizedPhone, response, 'FEEDBACK');
        } else {
          response = 'Unknown command. Available commands: PAUSE, RESUME, SUMMARY, FEEDBACK (1-5), NEXT_TOPIC';
          await sendWhatsAppResponse(normalizedPhone, response);
        }
    }

    return response;
  } catch (error) {
    console.error('Command processing error:', error);
    return 'Sorry, there was an error processing your request.';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Log raw request body for debugging
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    // Parse the body and log it
    const body = JSON.parse(rawBody);
    console.log('Parsed webhook payload:', JSON.stringify(body, null, 2));

    // Log headers for debugging
    const headers = Object.fromEntries(req.headers.entries());
    console.log('Request headers:', headers);

    // Extract phone and message from Gupshup webhook payload
    const phone = body.payload?.sender?.phone;
    const message = body.payload?.message?.text;

    console.log('Extracted data:', { phone, message });

    if (!phone || !message) {
      console.error('Missing required fields:', { phone, message });
      throw new Error('Invalid webhook payload structure');
    }

    // Process the command and get response
    const response = await processCommand(phone, message);
    console.log('Command response:', response);

    return new Response(
      JSON.stringify({ success: true, message: 'OK' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    // Log the full error object
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message 
      }),
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