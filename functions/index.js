const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const anthropicKey = defineSecret("ANTHROPIC_API_KEY");

exports.getPriceSuggestion = onRequest(
  { secrets: [anthropicKey], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: { message: "Method not allowed" } });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: { message: "Missing prompt" } });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey.value(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(500).json({ error: { message: err.message } });
    }
  }
);