import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('Supabase URL is not configured');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    console.log('Rejected non-POST request:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log complete request details
    console.log('=== Incoming Webhook Details ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('=== End Request Details ===');

    // Forward to Supabase function with minimal headers
    const response = await fetch(`${SUPABASE_URL}/functions/v1/handle-interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'whatsapp',
      },
      body: JSON.stringify(req.body),
    });

    // Log complete Supabase response
    console.log('=== Supabase Response Details ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log('Raw Response Body:', responseText);

    // Try to parse JSON response
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
      console.log('Parsed JSON Response:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Response is not JSON:', responseText);
      jsonResponse = { message: responseText };
    }
    console.log('=== End Response Details ===');

    // Forward response to client
    const responseHeaders = {
      'Content-Type': 'application/json',
      'x-proxy-status': response.status.toString(),
    };

    console.log('Sending response to client:', {
      status: response.status,
      headers: responseHeaders,
      body: jsonResponse,
    });

    return res.status(response.status)
      .set(responseHeaders)
      .json(jsonResponse);

  } catch (error) {
    console.error('=== Proxy Error ===');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('=== End Error Details ===');

    return res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}