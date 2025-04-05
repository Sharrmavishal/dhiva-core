// supabase/functions/deliver-microlearnings/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

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
    console.error("Fatal error in function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function deliverMicrolearning(learner: Learner, content: Content): Promise<void> {
  const now = new Date().toISOString();

  if (learner.delivery_preference === 'wa' || learner.delivery_preference === 'both' || !learner.delivery_preference) {
    if (learner.phone) {
      try {
        // Simulate WhatsApp delivery
        console.log("Sending WhatsApp to", learner.phone);
        await logDelivery(learner.id, content.id, 'whatsapp', 'success', now);
      } catch (err) {
        console.error("WhatsApp failed:", err);
        await logDelivery(learner.id, content.id, 'whatsapp', 'failure', now, err.message);
      }
    }
  }

  if (learner.delivery_preference === 'email' || learner.delivery_preference === 'both' || !learner.delivery_preference) {
    if (learner.email) {
      try {
        // Simulate Email delivery
        console.log("Sending Email to", learner.email);
        await logDelivery(learner.id, content.id, 'email', 'success', now);
      } catch (err) {
        console.error("Email failed:", err);
        await logDelivery(learner.id, content.id, 'email', 'failure', now, err.message);
      }
    }
  }
}

async function logDelivery(
  learner_id: string,
  microlearning_id: string,
  channel: string,
  status: string,
  timestamp: string,
  error_message?: string
) {
  await supabase.from("delivery_logs").insert([
    {
      learner_id,
      microlearning_id,
      channel,
      status,
      timestamp,
      success: status === "success",
      error_message: error_message || null,
    },
  ]);
}
