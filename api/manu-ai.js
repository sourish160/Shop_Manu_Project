// ==============================================================================
// MANU AI - VERCEL SERVERLESS FUNCTION
// Phase 2: Secure Server-side MANU AI Endpoint for Vercel
// Runtime: Node.js / Vercel Serverless
// ==============================================================================

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-session-token');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages = [],
      conversation_id = null,
      session_id = null,
      session_token = null,
      user_location = null
    } = req.body || {};

    if (!session_token || typeof session_token !== 'string') {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages cannot be empty.' });
    }

    const baseUrl = process.env.VITE_INSFORGE_URL || 'https://yke9qwgm.us-east.insforge.app';
    const anonKey = process.env.VITE_INSFORGE_ANON_KEY || 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

    // Proxy request to InsForge Edge Function 'manu-ai'
    const fnResponse = await fetch(`${baseUrl}/api/functions/manu-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'x-session-token': session_token
      },
      body: JSON.stringify({
        messages,
        conversation_id,
        session_id,
        session_token,
        user_location
      })
    });

    res.writeHead(fnResponse.status, {
      'Content-Type': fnResponse.headers.get('content-type') || 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    if (fnResponse.body) {
      const reader = fnResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();

  } catch (err) {
    console.error('MANU AI Vercel Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
    res.end();
  }
}

