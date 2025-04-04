import { supabase } from '../Services/supabaseService';
import openaiService from '../Services/openaiService';

interface TestResult {
  step: string;
  status: 'success' | 'failure';
  error?: string;
}

export async function runE2ETest() {
  const results: TestResult[] = [];
  const testUser = {
    email: 'e2e_test@dhiva.co',
    phone: '+15557141992'
  };

  try {
    // Step 1: Create Topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .insert({
        name: 'Sleep Science',
        user_id: testUser.email,
        competency_level: 'intermediate',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (topicError) throw new Error(`Topic creation failed: ${topicError.message}`);
    results.push({ step: 'Topic Creation', status: 'success' });

    // Step 2: Save Quiz Results
    const { data: profile, error: profileError } = await supabase
      .from('learner_profiles')
      .insert({
        user_id: testUser.email,
        course_id: topic.id,
        prior_exposure: 'somewhat',
        preferred_format: 'summaries',
        self_assessed_level: 'intermediate',
        track_version: 'B'
      })
      .select()
      .single();

    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);
    results.push({ step: 'Quiz Completion', status: 'success' });

    // Step 3: Save Preferences
    const { error: prefError } = await supabase
      .from('preferences')
      .insert({
        email: testUser.email,
        phone_number: testUser.phone,
        delivery_modes: ['whatsapp'],
        frequency: 'daily',
        time_of_day: 'morning',
        consent_given: true
      });

    if (prefError) throw new Error(`Preferences save failed: ${prefError.message}`);
    results.push({ step: 'Preferences Setup', status: 'success' });

    // Step 4: Generate Learning Plan
    const { data: plan, error: planError } = await openaiService.generateLearningPlan(
      topic.id,
      'intermediate'
    );

    if (planError) throw new Error(`Learning plan generation failed: ${planError}`);
    results.push({ step: 'Learning Plan Generation', status: 'success' });

    // Step 5: Log Consent
    const { error: consentError } = await supabase
      .from('consent_logs')
      .insert({
        user_id: testUser.email,
        type: 'terms',
        details: {
          accepted_at: new Date().toISOString(),
          delivery_modes: ['whatsapp']
        }
      });

    if (consentError) throw new Error(`Consent logging failed: ${consentError.message}`);
    results.push({ step: 'Consent Logging', status: 'success' });

    // Step 6: Trigger WhatsApp Delivery
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        phoneNumber: testUser.phone,
        message: 'Welcome to your Sleep Science learning journey!',
        command: 'WELCOME'
      }),
    });

    if (!response.ok) throw new Error('WhatsApp delivery failed');
    results.push({ step: 'WhatsApp Delivery', status: 'success' });

    // Step 7: Validate Trust Wrapping
    const { data: microlearnings, error: mlError } = await supabase
      .from('microlearnings')
      .select('*')
      .eq('topic_id', topic.id);

    if (mlError) throw new Error(`Microlearning validation failed: ${mlError.message}`);
    
    const trustValid = microlearnings?.every(ml => 
      ml.source_type && 
      ml.generated_by && 
      typeof ml.confidence_score === 'number'
    );

    if (!trustValid) throw new Error('Trust wrapping validation failed');
    results.push({ step: 'Trust Wrapping Validation', status: 'success' });

    return {
      success: true,
      results,
      summary: {
        totalSteps: results.length,
        passedSteps: results.filter(r => r.status === 'success').length,
        failedSteps: results.filter(r => r.status === 'failure').length
      }
    };

  } catch (error) {
    console.error('E2E Test Error:', error);
    results.push({
      step: 'Test Execution',
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      results,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}