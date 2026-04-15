import { hasOpenAI, openaiClient } from "../config/openai.js";

const REPORT_KEYWORDS = ["bao cao", "báo cáo", "report"];
const ANALYZE_KEYWORDS = ["phan tich", "phân tích", "analyze"];
const INCOME_KEYWORDS = ["thu", "nhan", "nhận", "luong", "lương", "thuong", "thưởng", "salary"];

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toUnsignedNumber(raw) {
  const normalized = String(raw || "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}

function parseAmount(prompt) {
  const match = prompt.match(/(\d+[\d.,]*)\s*(k|nghin|nghìn|tr|trieu|triệu|vnd|đ|d)?/i);
  if (!match) return 50000;

  const base = toUnsignedNumber(match[1]);
  if (!base) return 50000;

  const unit = String(match[2] || "").toLowerCase();
  if (unit === "k" || unit === "nghin" || unit === "nghìn") return base * 1000;
  if (unit === "tr" || unit === "trieu" || unit === "triệu") return base * 1000000;
  return base;
}

function extractCategoryHint(prompt) {
  const lowered = prompt.toLowerCase();
  const mappings = [
    { hint: "an", keywords: ["an", "ăn", "uong", "uống", "com", "cơm", "tra sua", "trà sữa", "ca phe", "cà phê"] },
    { hint: "xang", keywords: ["xang", "xăng", "do xe", "đổ xe"] },
    { hint: "di chuyen", keywords: ["xe om", "taxi", "grab", "di chuyen", "đi chuyển"] },
    { hint: "luong", keywords: ["luong", "lương", "salary"] },
    { hint: "thuong", keywords: ["thuong", "thưởng", "bonus"] }
  ];

  for (const mapping of mappings) {
    if (includesAny(lowered, mapping.keywords)) {
      return mapping.hint;
    }
  }

  return null;
}

function inferSimpleDecision(prompt) {
  const lowered = prompt.toLowerCase();

  if (includesAny(lowered, REPORT_KEYWORDS)) {
    return { skill: "getReport", args: { reportType: "monthly" } };
  }

  if (includesAny(lowered, ANALYZE_KEYWORDS)) {
    return { skill: "analyzeSpending", args: {} };
  }

  return {
    skill: "createTransaction",
    args: {
      amount: parseAmount(prompt),
      type: includesAny(lowered, INCOME_KEYWORDS) ? "income" : "expense",
      date: getTodayDate(),
      note: prompt,
      category_hint: extractCategoryHint(prompt)
    }
  };
}

function safeJsonParseDecision(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = rawText.slice(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw new Error("MODEL_JSON_PARSE_FAILED");
  }
}

function normalizeModelDecision(decision, prompt) {
  if (!decision || typeof decision !== "object") {
    return inferSimpleDecision(prompt);
  }

  const skill = typeof decision.skill === "string" ? decision.skill : "";
  if (!["createTransaction", "getReport", "analyzeSpending"].includes(skill)) {
    return inferSimpleDecision(prompt);
  }

  const args = decision.args && typeof decision.args === "object" ? { ...decision.args } : {};
  if (skill === "createTransaction") {
    if (!args.note) args.note = prompt;
    if (!args.date) args.date = getTodayDate();
    if (!args.amount) args.amount = parseAmount(prompt);
    if (!args.type) {
      args.type = includesAny(prompt.toLowerCase(), INCOME_KEYWORDS) ? "income" : "expense";
    }
    if (!args.category_hint) {
      args.category_hint = extractCategoryHint(prompt);
    }
  }

  return { skill, args };
}

export async function inferSkillFromPrompt(prompt) {
  if (!hasOpenAI) {
    return inferSimpleDecision(prompt);
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
  try {
    const parsed = safeJsonParseDecision(text);
    return normalizeModelDecision(parsed, prompt);
  } catch {
    return inferSimpleDecision(prompt);
  }
}
