import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getLearnerProfile,
  updateTable,
  selectFrom
} from './supabaseService.ts'; // ✅ Correct local path
import { sendEmail } from './resendService.ts'; // ✅ Correct local path

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Learner {
  id: string;
  email?: string;
  phone_number?: string;
  delivery_preference: 'whatsapp' | 'email' | 'both';
}

interface DeliveryResult {
  success: boolean;
  method: string;
  error?: string;
}

async function sendWhatsApp(to: string, content: string): Promise<void> {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ phoneNumber: to, message: content }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send WhatsApp message: ${error}`);
  }
}

async function logDelivery(
  microlearningId: string,
  learnerId: string,
  method: string,
  success: boolean,
  error?: string
): Promise<void> {
  await updateTable(
    'delivery_logs',
    {
      microlearning_id: microlearningId,
      learner_id: learnerId,
      delivery_method: method,
      success,
      error_message: error,
      delivered_at: new Date().toISOString()
    },
    []
  );
}

async function deliverToLearner(
  learner: Learner,
  content: string,
  microlearningId: string,
  dayNumber: number,
  totalDays: number
): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];

  try {
    switch (learner.delivery_preference) {
      case 'whatsapp':
        if (!learner.phone_number) {
          results.push({ success: false, method: 'whatsapp', error: 'No phone number available' });
          if (learner.email) {
            await sendEmail({ to: learner.email, subject: `Your Daily Learning - Day ${dayNumber}`, html: content });
            results.push({ success: true, method: 'email' });
            await logDelivery(microlearningId, learner.id, 'email', true);
          }
        } else {
          await sendWhatsApp(learner.phone_number, content);
          results.push({ success: true, method: 'whatsapp' });
          await logDelivery(microlearningId, learner.id, 'whatsapp', true);
        }
        break;

      case 'email':
        if (!learner.email) {
          results.push({ success: false, method: 'email', error: 'No email address available' });
          if (learner.phone_number) {
            await sendWhatsApp(learner.phone_number, content);
            results.push({ success: true, method: 'whatsapp' });
            await logDelivery(microlearningId, learner.id, 'whatsapp', true);
          }
        } else {
          await sendEmail({ to: learner.email, subject: `Your Daily Learning - Day ${dayNumber}`, html: content });
          results.push({ success: true, method: 'email' });
          await logDelivery(microlearningId, learner.id, 'email', true);
        }
        break;

      case 'both':
        if (learner.phone_number) {
          await sendWhatsApp(learner.phone_number, content);
          results.push({ success: true, method: 'whatsapp' });
          await logDelivery(microlearningId, learner.id, 'whatsapp', true);
        } else {
          results.push({ success: false, method: 'whatsapp', error: 'No phone number available' });
        }

        if (learner.email) {
          await new Promise(resolve => setTimeout(resolve, 300000)); // 5-min delay
          await sendEmail({ to: learner.email, subject: `Your Daily Learning - Day ${dayNumber}`, html: content });
          results.push({ success: true, method: 'email' });
          await logDelivery(microlearningId, learner.id, 'email', true);
        } else {
          results.push({ success: false, method: 'email', error: 'No email address available' });
        }
        break;

      default:
        results.push({ success: false, method: 'unknown', error: `Invalid delivery preference: ${learner.delivery_preference}` });
    }
  } catch (error) {
    console.error(`Error delivering to learner ${learner.id}:`, error);
    results.push({ success: false, method: 'all', error: error.message });
    await logDelivery(microlearningId, learner.id, 'all', false, error.message);
  }

  return results;
}

async function deliverMicrolearnings() {
  const now = new Date();

  const { data: pendingLearnings } = await selectFrom(
    'microlearnings',
    `*, topics ( name, user_id )`,
    [
      { column: 'status', operator: 'eq', value: 'pending' },
      { column: 'scheduled_for', operator: 'lte', value: now.toISOString() }
    ]
  );

  if (!pendingLearnings?.length) return;

  for (const learning of pendingLearnings) {
    try {
      const { data: learner } = await getLearnerProfile(learning.topics.user_id, learning.topic_id);

      if (!learner) {
        console.error(`No learner profile found for user ${learning.topics.user_id}`);
        continue;
      }

      const { data: totalDaysData } = await selectFrom(
        'microlearnings',
        '*',
        [{ column: 'topic_id', operator: 'eq', value: learning.topic_id }]
      );

      const totalDays = totalDaysData?.length || 1;

      const deliveryResults = await deliverToLearner(
        learner,
        learning.content,
        learning.id,
        learning.day_number,
        totalDays
      );

      if (deliveryResults.some(result => result.success)) {
        await updateTable(
          'microlearnings',
          { status: 'sent', sent_at: new Date().toISOString() },
          [{ column: 'id', operator: 'eq', value: learning.id }]
        );
      }

      console.log(`Delivery results for microlearning ${learning.id}:`, deliveryResults);

    } catch (error) {
      console.error(`Failed to deliver microlearning ${learning.id}:`, error);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await deliverMicrolearnings();
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error delivering microlearnings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
