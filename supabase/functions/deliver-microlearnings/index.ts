// supabase/functions/deliver-microlearnings/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define Learner type inline
interface Learner {
  id: string;
  phone?: string;
  email?: string;
  delivery_preference?: 'wa' | 'email' | 'both';
}

// Define content type
interface Content {
  id: string;
  message: string;
  title?: string;
}

serve(async (req: Request) => {
  try {
    const { learner, content } = await req.json();

    await deliverMicrolearning(learner, content);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in delivery function:", error);
    return new Response(JSON.stringify({ error: "Delivery failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Main delivery logic
 */
async function deliverMicrolearning(learner: Learner, content: Content): Promise<void> {
  try {
    if (!learner.delivery_preference || learner.delivery_preference === 'both') {
      if (learner.phone) {
        await sendWhatsApp(learner, content);
        console.log(`WhatsApp sent to learner ${learner.id}`);
      }
      if (learner.email) {
        setTimeout(async () => {
          await sendEmail(learner, content);
          console.log(`Email sent to learner ${learner.id} after delay`);
        }, 300000); // 5-minute delay
      }
    } else if (learner.delivery_preference === 'wa') {
      if (learner.phone) {
        await sendWhatsApp(learner, content);
        console.log(`WhatsApp sent to learner ${learner.id}`);
      } else if (learner.email) {
        console.log(`Fallback to email for learner ${learner.id}`);
        await sendEmail(learner, content);
      }
    } else if (learner.delivery_preference === 'email') {
      if (learner.email) {
        await sendEmail(learner, content);
        console.log(`Email sent to learner ${learner.id}`);
      } else if (learner.phone) {
        console.log(`Fallback to WhatsApp for learner ${learner.id}`);
        await sendWhatsApp(learner, content);
      }
    } else {
      console.error(`Unknown preference for learner ${learner.id}: ${learner.delivery_preference}`);
    }

    await updateDeliveryStats(learner.id, content.id);
  } catch (err) {
    console.error(`Error delivering to learner ${learner.id}:`, err);
    throw err;
  }
}

// --- Replace with real implementations as needed ---

async function sendWhatsApp(learner: Learner, content: Content): Promise<void> {
  // Placeholder for WhatsApp logic
  console.log(`(Pretend) sending WhatsApp to ${learner.phone}: ${content.message}`);
}

async function sendEmail(learner: Learner, content: Content): Promise<void> {
  // Placeholder for Resend email logic
  console.log(`(Pretend) sending Email to ${learner.email}: ${content.title}`);
}

async function updateDeliveryStats(learnerId: string, contentId: string): Promise<void> {
  // Placeholder for tracking logic
  console.log(`(Pretend) updated delivery stats for ${learnerId} and ${contentId}`);
}
