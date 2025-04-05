// test-fallback-delivery.ts
// Test script to validate the WhatsApp to email fallback delivery implementation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0';
import { deliverMicrolearnings } from './deliver-microlearnings.ts';
import { sendWhatsAppMessage } from './send-whatsapp.ts';
import { sendEmailFallback } from './send-email.ts';

// Mock environment for testing
const mockEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-key',
  GUPSHUP_API_KEY: 'mock-gupshup-key',
  RESEND_API_KEY: 'mock-resend-key',
  FROM_EMAIL_ADDRESS: 'test@dhiva.ai'
};

// Mock data for testing
const mockMicrolearning = {
  id: 'mock-microlearning-id',
  content: JSON.stringify({
    intro: 'This is a test introduction.',
    concept: 'This is a test concept.',
    recap: 'This is a test recap.'
  }),
  day_number: 1,
  topics: {
    id: 'mock-topic-id',
    name: 'Test Topic',
    course_id: 'mock-course-id',
    user_id: 'mock-user-id'
  },
  course_subscribers: {
    id: 'mock-subscriber-id',
    user_id: 'mock-user-id',
    current_day: 1,
    delivery_preference: 'whatsapp',
    users: {
      id: 'mock-user-id',
      email: 'test@example.com',
      phone_number: '9123456789',
      name: 'Test User'
    }
  }
};

// Mock functions for testing
const mockFunctions = {
  // Mock Supabase client
  createClient: () => ({
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          order: (column, { ascending }) => ({
            limit: (limit) => ({
              data: [mockMicrolearning],
              error: null
            })
          })
        })
      }),
      insert: (data) => ({
        data: { id: 'mock-log-id' },
        error: null
      }),
      update: (data) => ({
        eq: (column, value) => ({
          data: { id: value },
          error: null
        })
      })
    })
  }),
  
  // Mock WhatsApp sending - success case
  sendWhatsAppSuccess: async (phoneNumber, content) => ({
    success: true,
    messageId: 'mock-whatsapp-id'
  }),
  
  // Mock WhatsApp sending - failure case
  sendWhatsAppFailure: async (phoneNumber, content) => ({
    success: false,
    error: 'Mock WhatsApp delivery failure'
  }),
  
  // Mock Email sending - success case
  sendEmailSuccess: async (params) => ({
    success: true,
    messageId: 'mock-email-id'
  }),
  
  // Mock Email sending - failure case
  sendEmailFailure: async (params) => ({
    success: false,
    error: 'Mock email delivery failure'
  })
};

/**
 * Run tests for the fallback delivery implementation
 */
async function runTests() {
  console.log('Starting fallback delivery tests...');
  
  // Test scenarios
  await testWhatsAppSuccess();
  await testWhatsAppFailureEmailSuccess();
  await testWhatsAppFailureEmailFailure();
  
  console.log('All tests completed.');
}

/**
 * Test scenario: WhatsApp delivery succeeds
 */
async function testWhatsAppSuccess() {
  console.log('\n--- Test: WhatsApp delivery succeeds ---');
  
  // Mock dependencies
  global.createClient = mockFunctions.createClient;
  global.sendWhatsAppMessage = mockFunctions.sendWhatsAppSuccess;
  global.sendEmailFallback = mockFunctions.sendEmailSuccess;
  
  // Set up environment
  for (const [key, value] of Object.entries(mockEnv)) {
    Deno.env.set(key, value);
  }
  
  // Create mock request
  const request = new Request('http://localhost/deliver', {
    method: 'POST'
  });
  
  try {
    // Execute delivery function
    const response = await deliverMicrolearnings(request);
    const result = await response.json();
    
    // Validate results
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    console.log('WhatsApp deliveries:', result.summary.whatsappDelivered);
    console.log('Email fallbacks attempted:', result.summary.emailFallbacks);
    
    // Assert expectations
    const passed = 
      response.status === 200 && 
      result.success === true && 
      result.summary.whatsappDelivered === 1 && 
      result.summary.emailFallbacks === 0;
    
    console.log('Test passed:', passed);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

/**
 * Test scenario: WhatsApp delivery fails, Email fallback succeeds
 */
async function testWhatsAppFailureEmailSuccess() {
  console.log('\n--- Test: WhatsApp fails, Email succeeds ---');
  
  // Mock dependencies
  global.createClient = mockFunctions.createClient;
  global.sendWhatsAppMessage = mockFunctions.sendWhatsAppFailure;
  global.sendEmailFallback = mockFunctions.sendEmailSuccess;
  
  // Create mock request
  const request = new Request('http://localhost/deliver', {
    method: 'POST'
  });
  
  try {
    // Execute delivery function
    const response = await deliverMicrolearnings(request);
    const result = await response.json();
    
    // Validate results
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    console.log('WhatsApp deliveries:', result.summary.whatsappDelivered);
    console.log('Email fallbacks attempted:', result.summary.emailFallbacks);
    console.log('Email fallbacks successful:', result.summary.emailFallbackSuccessful);
    
    // Assert expectations
    const passed = 
      response.status === 200 && 
      result.success === true && 
      result.summary.whatsappDelivered === 0 && 
      result.summary.emailFallbacks === 1 && 
      result.summary.emailFallbackSuccessful === 1;
    
    console.log('Test passed:', passed);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

/**
 * Test scenario: Both WhatsApp and Email delivery fail
 */
async function testWhatsAppFailureEmailFailure() {
  console.log('\n--- Test: Both WhatsApp and Email fail ---');
  
  // Mock dependencies
  global.createClient = mockFunctions.createClient;
  global.sendWhatsAppMessage = mockFunctions.sendWhatsAppFailure;
  global.sendEmailFallback = mockFunctions.sendEmailFailure;
  
  // Create mock request
  const request = new Request('http://localhost/deliver', {
    method: 'POST'
  });
  
  try {
    // Execute delivery function
    const response = await deliverMicrolearnings(request);
    const result = await response.json();
    
    // Validate results
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    console.log('WhatsApp deliveries:', result.summary.whatsappDelivered);
    console.log('Email fallbacks attempted:', result.summary.emailFallbacks);
    console.log('Email fallbacks successful:', result.summary.emailFallbackSuccessful);
    console.log('Total failed:', result.summary.failed);
    
    // Assert expectations
    const passed = 
      response.status === 200 && 
      result.success === true && // Overall process succeeded even if deliveries failed
      result.summary.whatsappDelivered === 0 && 
      result.summary.emailFallbacks === 1 && 
      result.summary.emailFallbackSuccessful === 0 &&
      result.summary.failed === 1;
    
    console.log('Test passed:', passed);
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the tests
runTests();
