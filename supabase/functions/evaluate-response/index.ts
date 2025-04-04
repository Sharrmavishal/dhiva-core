import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
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

interface ResponseEvaluation {
  engagement_score: number;
  comprehension_score: number;
  feedback_tag: 'engaged' | 'confused' | 'unsure' | 'skipped';
}

async function evaluateResponse(
  messageSent: string,
  userReply: string,
  courseContext: string
): Promise<ResponseEvaluation> {
  const prompt = `As an educational assessment AI, evaluate this learner's reply in the context of the message they received.
    
    Course Context: ${courseContext}
    Message Sent: ${messageSent}
    User Reply: ${userReply}
    
    Analyze the response for:
    1. Engagement (0-100):
       - Length and detail of response
       - Relevance to prompt
       - Use of domain-specific terms
       - Signs of reflection/critical thinking
    
    2. Comprehension (0-100):
       - Accuracy of understanding
       - Proper use of concepts
       - Clarity of explanation
       - Connection to previous learning
    
    3. Feedback Tag:
       - "engaged": Shows active participation and understanding
       - "confused": Indicates misunderstanding or uncertainty
       - "unsure": Partial understanding but lacks confidence
       - "skipped": Minimal or no meaningful response
    
    Format response as JSON with:
    - engagement_score: number (0-100)
    - comprehension_score: number (0-100)
    - feedback_tag: "engaged" | "confused" | "unsure" | "skipped"`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert educational assessment AI that evaluates learner responses.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  });

  if (!completion.choices[0]?.message?.content) {
    throw new Error('No evaluation received from OpenAI');
  }

  return JSON.parse(completion.choices[0].message.content);
}

async function updateLearnerTrack(
  userId: string,
  courseId: string,
  evaluation: ResponseEvaluation
) {
  // Get recent responses
  const { data: recentResponses } = await supabase
    .from('learner_responses')
    .select('comprehension_score, feedback_tag')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!recentResponses?.length) return;

  // Get current track
  const { data: profile } = await supabase
    .from('learner_profiles')
    .select('track_version')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (!profile) return;

  let newTrack = profile.track_version;
  let needsRecap = false;

  // Apply logic rules
  const avgComprehension = recentResponses.reduce(
    (sum, r) => sum + (r.comprehension_score || 0),
    evaluation.comprehension_score
  ) / (recentResponses.length + 1);

  const confusedCount = recentResponses.filter(
    r => r.feedback_tag === 'confused'
  ).length + (evaluation.feedback_tag === 'confused' ? 1 : 0);

  // Track switching logic
  if (avgComprehension < 40 && profile.track_version !== 'A') {
    newTrack = 'A';
  } else if (avgComprehension > 85 && profile.track_version !== 'C') {
    newTrack = 'C';
  }

  // Recap injection logic
  if (confusedCount >= 2) {
    needsRecap = true;
  }

  // Update track if changed
  if (newTrack !== profile.track_version) {
    await supabase
      .from('learner_profiles')
      .update({ track_version: newTrack })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    // Notify about track change
    if (newTrack === 'A') {
      // TODO: Send message about simplified content
    } else if (newTrack === 'C') {
      // TODO: Send message about advanced content
    }
  }

  return { newTrack, needsRecap };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId,
      courseId,
      dayNumber,
      messageSent,
      messageType,
      userReply,
      courseContext,
    } = await req.json();

    // Skip evaluation for empty replies
    if (!userReply?.trim()) {
      const evaluation: ResponseEvaluation = {
        engagement_score: 0,
        comprehension_score: 0,
        feedback_tag: 'skipped',
      };

      await supabase
        .from('learner_responses')
        .insert({
          user_id: userId,
          course_id: courseId,
          day_number: dayNumber,
          message_sent: messageSent,
          message_type: messageType,
          user_reply: userReply,
          ...evaluation,
        });

      return new Response(
        JSON.stringify({ success: true, evaluation }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Evaluate response
    const evaluation = await evaluateResponse(messageSent, userReply, courseContext);

    // Store response and evaluation
    await supabase
      .from('learner_responses')
      .insert({
        user_id: userId,
        course_id: courseId,
        day_number: dayNumber,
        message_sent: messageSent,
        message_type: messageType,
        user_reply: userReply,
        ...evaluation,
      });

    // Update learner track if needed
    const trackUpdate = await updateLearnerTrack(userId, courseId, evaluation);

    return new Response(
      JSON.stringify({
        success: true,
        evaluation,
        trackUpdate,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error evaluating response:', error);
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