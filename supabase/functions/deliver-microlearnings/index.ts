// Delivery Function Update (Based on Preference)
// This code should be integrated into your deliver-microlearnings.ts file or central delivery logic

import { Learner } from './types'; // Adjust import path as needed

/**
 * Main function to deliver microlearnings based on learner preferences
 * @param learner The learner object containing delivery preferences and contact info
 * @param content The content to be delivered
 */
export async function deliverMicrolearning(learner: Learner, content: any): Promise<void> {
  try {
    // Check delivery preference and send accordingly
    if (!learner.delivery_preference || learner.delivery_preference === 'both') {
      // Default to both if preference is not set or explicitly set to both
      
      // Send via WhatsApp if phone number is available
      if (learner.phone) {
        await sendWhatsApp(learner, content);
        console.log(`WhatsApp sent to learner ${learner.id}`);
      } else {
        console.log(`Skipping WhatsApp delivery for learner ${learner.id} - no phone number`);
      }
      
      // Send via email after a delay if email is available
      if (learner.email) {
        // Send email after 5 minutes (300000 ms)
        setTimeout(async () => {
          await sendEmail(learner, content);
          console.log(`Email sent to learner ${learner.id} after delay`);
        }, 300000);
      } else {
        console.log(`Skipping email delivery for learner ${learner.id} - no email address`);
      }
    } else if (learner.delivery_preference === 'wa') {
      // WhatsApp only
      if (learner.phone) {
        await sendWhatsApp(learner, content);
        console.log(`WhatsApp sent to learner ${learner.id}`);
      } else {
        console.log(`Cannot deliver to learner ${learner.id} - WhatsApp preference but no phone number`);
        // Optionally fall back to email if available
        if (learner.email) {
          console.log(`Falling back to email for learner ${learner.id}`);
          await sendEmail(learner, content);
        }
      }
    } else if (learner.delivery_preference === 'email') {
      // Email only
      if (learner.email) {
        await sendEmail(learner, content);
        console.log(`Email sent to learner ${learner.id}`);
      } else {
        console.log(`Cannot deliver to learner ${learner.id} - Email preference but no email address`);
        // Optionally fall back to WhatsApp if available
        if (learner.phone) {
          console.log(`Falling back to WhatsApp for learner ${learner.id}`);
          await sendWhatsApp(learner, content);
        }
      }
    } else {
      console.error(`Unknown delivery preference for learner ${learner.id}: ${learner.delivery_preference}`);
    }
    
    // Update delivery statistics or logs as needed
    await updateDeliveryStats(learner.id, content.id);
    
  } catch (error) {
    console.error(`Error delivering content to learner ${learner.id}:`, error);
    // Log error or retry logic here
  }
}

/**
 * Send content via WhatsApp
 * @param learner The learner object
 * @param content The content to send
 */
async function sendWhatsApp(learner: Learner, content: any): Promise<void> {
  // Your existing WhatsApp sending logic
  // This function should already be implemented in your codebase
  
  // Example implementation:
  // await whatsappClient.sendMessage({
  //   to: learner.phone,
  //   type: 'text',
  //   text: {
  //     body: content.message
  //   }
  // });
}

/**
 * Send content via Email using Resend API
 * @param learner The learner object
 * @param content The content to send
 */
async function sendEmail(learner: Learner, content: any): Promise<void> {
  // Your existing email sending logic using Resend API
  // This function should already be implemented in your codebase
  
  // Example implementation:
  // await resend.emails.send({
  //   from: 'noreply@yourdomain.com',
  //   to: learner.email,
  //   subject: content.title,
  //   html: generateEmailHtml(content, learner)
  // });
}

/**
 * Update delivery statistics
 * @param learnerId The ID of the learner
 * @param contentId The ID of the content
 */
async function updateDeliveryStats(learnerId: string, contentId: string): Promise<void> {
  // Implementation depends on your tracking needs
  // Example:
  // await db.deliveryStats.create({
  //   data: {
  //     learnerId,
  //     contentId,
  //     deliveredAt: new Date()
  //   }
  // });
}

// Types (if not imported from elsewhere)
// interface Learner {
//   id: string;
//   phone?: string;
//   email?: string;
//   delivery_preference?: 'wa' | 'email' | 'both';
//   onboardingStep?: string;
//   onboardingComplete?: boolean;
// }
