import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@3.2.0";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

async function sendEmail(to: string, content: string, dayNumber: number, totalDays: number): Promise<void> {
  await resend.emails.send({
    from: 'Nataris <learning@nataris.com>',
    to: [to],
    subject: `Your Daily Nataris Learning - Day ${dayNumber}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
        ${content}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666;">Day ${dayNumber} of ${totalDays}</p>
        </div>
      </div>
    `,
  });
}

async function sendWhatsApp(to: string, content: string): Promise<void> {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      phoneNumber: to,
      message: content,
    }),
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
  await supabase
    .from('delivery_logs')
    .insert({
      microlearning_id: microlearningId,
      learner_id: learnerId,
      delivery_method: method,
      success,
      error_message: error,
      delivered_at: new Date().toISOString()
    });
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
          results.push({
            success: false,
            method: 'whatsapp',
            error: 'No phone number available'
          });
          // Fallback to email if available
          if (learner.email) {
            await sendEmail(learner.email, content, dayNumber, totalDays);
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
          results.push({
            success: false,
            method: 'email',
            error: 'No email address available'
          });
          // Fallback to WhatsApp if available
          if (learner.phone_number) {
            await sendWhatsApp(learner.phone_number, content);
            results.push({ success: true, method: 'whatsapp' });
            await logDelivery(microlearningId, learner.id, 'whatsapp', true);
          }
        } else {
          await sendEmail(learner.email, content, dayNumber, totalDays);
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
          results.push({
            success: false,
            method: 'whatsapp',
            error: 'No phone number available'
          });
        }

        if (learner.email) {
          // Add 5-minute delay for email
          await new Promise(resolve => setTimeout(resolve, 300000));
          await sendEmail(learner.email, content, dayNumber, totalDays);
          results.push({ success: true, method: 'email' });
          await logDelivery(microlearningId, learner.id, 'email', true);
        } else {
          results.push({
            success: false,
            method: 'email',
            error: 'No email address available'
          });
        }
        break;

      default:
        results.push({
          success: false,
          method: 'unknown',
          error: `Invalid delivery preference: ${learner.delivery_preference}`
        });
    }
  } catch (error) {
    console.error(`Error delivering to learner ${learner.id}:`, error);
    results.push({
      success: false,
      method: 'all',
      error: error.message
    });
    await logDelivery(
      microlearningId,
      learner.id,
      'all',
      false,
      error.message
    );
  }

  return results;
}

async function deliverMicrolearnings() {
  const now = new Date();
  
  // Get all pending microlearnings scheduled for now
  const { data: pendingLearnings, error } = await supabase
    .from('microlearnings')
    .select(`
      *,
      topics (
        name,
        user_id
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString());

  if (error) throw error;
  if (!pendingLearnings?.length) return;

  for (const learning of pendingLearnings) {
    try {
      // Get learner profile with delivery preferences
      const { data: learner } = await supabase
        .from('learner_profiles')
        .select(`
          id,
          email,
          phone_number,
          delivery_preference
        `)
        .eq('user_id', learning.topics.user_id)
        .single();

      if (!learner) {
        console.error(`No learner profile found for user ${learning.topics.user_id}`);
        continue;
      }

      // Get total days for this topic
      const { count: totalDays } = await supabase
        .from('microlearnings')
        .select('*', { count: 'exact' })
        .eq('topic_id', learning.topic_id);

      // Deliver content based on preferences
      const deliveryResults = await deliverToLearner(
        learner,
        learning.content,
        learning.id,
        learning.day_number,
        totalDays || 1
      );

      // Update microlearning status if at least one delivery method succeeded
      if (deliveryResults.some(result => result.success)) {
        await supabase
          .from('microlearnings')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', learning.id);
      }

      // Log delivery results
      console.log(`Delivery results for microlearning ${learning.id}:`, deliveryResults);

    } catch (error) {
      console.error(`Failed to deliver microlearning ${learning.id}:`, error);
    }
  }
}

// This function will be triggered by a cron job
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await deliverMicrolearnings();

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
    console.error('Error delivering microlearnings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});