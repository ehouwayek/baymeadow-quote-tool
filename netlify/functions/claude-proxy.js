// This function runs on Netlify's servers, not in the browser.
// It keeps your Anthropic API key completely hidden from anyone viewing the website.
// Written using Netlify's current Functions format (Web-standard Request/Response).

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Netlify's current runtime exposes env vars via the global Netlify object.
    // Fallback to process.env just in case, for compatibility.
    const apiKey = (typeof Netlify !== 'undefined' && Netlify.env)
      ? Netlify.env.get('ANTHROPIC_API_KEY')
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: 'Missing ANTHROPIC_API_KEY environment variable in Netlify settings.' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body
    });

    const data = await anthropicRes.text();

    return new Response(data, {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: err.message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
