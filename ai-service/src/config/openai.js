import OpenAI from "openai";

const rawApiKey = process.env.OPENAI_API_KEY || "";
const googleApiKey = process.env.GOOGLE_AI_API_KEY || (rawApiKey.startsWith("AIza") ? rawApiKey : "");
const openAIApiKey = rawApiKey && !rawApiKey.startsWith("AIza") ? rawApiKey : "";

export const hasGoogleAI = Boolean(googleApiKey);
export const hasOpenAI = Boolean(openAIApiKey);
export const googleModel = process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash";
export const openAIModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const activeAIProvider = hasGoogleAI ? "google-gemini" : hasOpenAI ? "openai" : "heuristic";

export const openaiClient = hasOpenAI
  ? new OpenAI({ apiKey: openAIApiKey })
  : null;

export async function generateWithGoogleAI({ systemPrompt, userPrompt }) {
  if (!hasGoogleAI) {
    throw new Error("GOOGLE_AI_NOT_CONFIGURED");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${googleApiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const detailText = await response.text();
    const err = new Error("GOOGLE_AI_REQUEST_FAILED");
    err.details = detailText;
    throw err;
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("GOOGLE_AI_EMPTY_RESPONSE");
  }

  return text;
}

export async function generateWithOpenAI({ systemPrompt, userPrompt }) {
  if (!hasOpenAI || !openaiClient) {
    throw new Error("OPENAI_NOT_CONFIGURED");
  }

  const response = await openaiClient.responses.create({
    model: openAIModel,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0
  });

  return response.output_text || "";
}
