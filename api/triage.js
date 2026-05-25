// ============================================================================
// /api/triage.js  —  Vercel serverless function
// ----------------------------------------------------------------------------
// The browser calls THIS endpoint (same origin), and this function calls Gemini.
// The GEMINI_API_KEY lives only here, as a Vercel environment variable, so it is
// never exposed to the client. Swap the model with the GEMINI_MODEL env var.
// ============================================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing 'prompt' in request body." });
  }

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing GEMINI_API_KEY. Add it in Vercel → Settings → Environment Variables." });
  }

  // gemini-2.5-flash = current stable free model. Override via GEMINI_MODEL if needed.
  const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": KEY, // current standard auth method for Gemini
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
         generationConfig: {     temperature: 0.2,
     maxOutputTokens: 8192,
     responseMimeType: "application/json",
     thinkingConfig: { thinkingBudget: 0 },
   },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Gemini API error" });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
