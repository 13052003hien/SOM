import { hasOpenAI, openaiClient } from "../config/openai.js";

export async function inferSkillFromPrompt(prompt) {
  const lowered = prompt.toLowerCase();

  if (!hasOpenAI) {
    if (lowered.includes("bao cao") || lowered.includes("report")) {
      return { skill: "getReport", args: { reportType: "monthly" } };
    }

    if (lowered.includes("phan tich") || lowered.includes("analyze")) {
      return { skill: "analyzeSpending", args: {} };
    }

    return {
      skill: "createTransaction",
      args: {
        wallet_id: 1,
        category_id: 1,
        amount: 50000,
        type: "expense",
        date: new Date().toISOString().slice(0, 10),
        note: prompt
      }
    };
  }

  const systemPrompt = [
    "You are a financial assistant.",
    "Return strict JSON only with keys: skill, args.",
    "skill must be one of: createTransaction, getReport, analyzeSpending.",
    "Do not include markdown or additional text."
  ].join(" ");

  const response = await openaiClient.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0
  });

  const text = response.output_text || "{}";
  return JSON.parse(text);
}
