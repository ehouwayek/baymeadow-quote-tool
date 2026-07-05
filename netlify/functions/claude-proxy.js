// This function runs on Netlify's servers, not in the browser.
// It keeps your Anthropic API key completely hidden from anyone viewing the website.

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const rawKey = (typeof Netlify !== 'undefined' && Netlify.env)
      ? Netlify.env.get('ANTHROPIC_API_KEY')
      : process.env.ANTHROPIC_API_KEY;

    // Defensive fix: strip any invisible whitespace, newlines, or stray
    // quote characters that copy-pasting into a dashboard can add.
    const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : rawKey;

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

    // If Anthropic rejected the key, attach safe diagnostic info
    // (never the full key) so we can see what's actually stored.
    if (anthropicRes.status === 401) {
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { error: { message: data } }; }
      parsed._debug = {
        keyLength: apiKey.length,
        keyStart: apiKey.slice(0, 12),
        keyEnd: apiKey.slice(-6)
      };
      return new Response(JSON.stringify(parsed), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
