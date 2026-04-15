import { generateWithGoogleAI, hasGoogleAI, hasOpenAI, openaiClient } from "../config/openai.js";

const REPORT_KEYWORDS = ["bao cao", "báo cáo", "report"];
const ANALYZE_KEYWORDS = ["phan tich", "phân tích", "analyze"];
const INCOME_KEYWORDS = ["thu", "nhan", "nhận", "luong", "lương", "thuong", "thưởng", "salary"];
const EXPENSE_KEYWORDS = ["chi", "chi tieu", "chi tiêu", "mua", "an", "ăn", "tra", "trả", "ton", "tốn"];
const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Ho_Chi_Minh";

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function formatDateInTimeZone(date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

function getTodayDate() {
  return formatDateInTimeZone(new Date());
}

function addDays(base, days) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function toLocalISODate(date) {
  return formatDateInTimeZone(date);
}

function parseDateFromPrompt(prompt) {
  const lowered = String(prompt || "").toLowerCase();
  const normalized = lowered
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const relaxed = normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  if (/\bhom\s+qua\b/.test(normalized) || /\bh\s*m\s+qua\b/.test(relaxed)) {
    return toLocalISODate(addDays(new Date(), -1));
  }

  if (/\bhom\s+kia\b/.test(normalized) || /\bh\s*m\s+kia\b/.test(relaxed)) {
    return toLocalISODate(addDays(new Date(), -2));
  }

  if (/\bhom\s+nay\b/.test(normalized) || /\bh\s*m\s+nay\b/.test(relaxed)) {
    return getTodayDate();
  }

  if (normalized.includes("ngay mai") || /\bmai\b/.test(normalized)) {
    return toLocalISODate(addDays(new Date(), 1));
  }

  const verboseDateMatch = normalized.match(/ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*nam\s*(\d{2,4}))?/i);
  if (verboseDateMatch) {
    const day = Number(verboseDateMatch[1]);
    const month = Number(verboseDateMatch[2]);
    const yearRaw = verboseDateMatch[3] ? Number(verboseDateMatch[3]) : new Date().getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const dmyMatch = normalized.match(/ngay\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const yearRaw = dmyMatch[3] ? Number(dmyMatch[3]) : new Date().getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return getTodayDate();
}

function toUnsignedNumber(raw) {
  const normalized = String(raw || "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}

function normalizeAmountText(promptText) {
  return String(promptText || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[,]/g, ".");
}

function stripVerboseDateText(promptText) {
  return String(promptText || "")
    .replace(/ngay\s*\d{1,2}\s*thang\s*\d{1,2}(?:\s*nam\s*\d{2,4})?/gi, " ")
    .replace(/ngay\s*\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/gi, " ");
}

function parseAmount(prompt) {
  const normalized = normalizeAmountText(prompt);
  const stripped = stripVerboseDateText(normalized);

  const compositeMatch = stripped.match(/(\d+[\d.]*)\s*(tr|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|tri?eu|trieu|trieu|trieu|trieu|trieu|triêu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|trieu|triệu)\s*(\d+[\d.]*)\s*(ngan|nghin|nghin|nghin|nghin|nghin|nghin|nghin|nghin|nghin|nghin|ngan|ngan|ngan|ngan|ngàn|nghìn)?/i);
  if (compositeMatch) {
    const millions = toUnsignedNumber(compositeMatch[1]);
    const thousands = toUnsignedNumber(compositeMatch[3]);
    if (millions != null) {
      return millions * 1000000 + (thousands != null ? thousands * 1000 : 0);
    }
  }

  const unitMatch = stripped.match(/(?:so tien|số tiền|tien|tiền|gia tri|giá trị)?[^\d]*(\d+[\d.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|trieu|triệu|vnd|đ|d)\b/i);
  const match = unitMatch || stripped.match(/(\d+[\d.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|trieu|triệu|vnd|đ|d)\b/i);
  if (match) {
    const base = toUnsignedNumber(match[1]);
    if (!base) return 50000;

    const unit = String(match[2] || "").toLowerCase();
    if (unit === "k" || unit === "nghin" || unit === "nghìn" || unit === "ngan" || unit === "ngàn") return base * 1000;
    if (unit === "tr" || unit === "trieu" || unit === "triệu") return base * 1000000;
    return base;
  }

  const moneyPhraseMatch = stripped.match(/(?:so tien|số tiền|tien|tiền|tong tien|tổng tiền)[^\d]*(\d+[\d.,]*)/i);
  if (moneyPhraseMatch) {
    const base = toUnsignedNumber(moneyPhraseMatch[1]);
    if (base) return base;
  }

  const fallbackNumbers = stripped.match(/\d+[\d.,]*/g) || [];
  if (fallbackNumbers.length) {
    const lastNumber = fallbackNumbers[fallbackNumbers.length - 1];
    const base = toUnsignedNumber(lastNumber);
    if (base) return base;
  }

  return 50000;
}

function extractCategoryHint(prompt) {
  const lowered = prompt.toLowerCase();
  const mappings = [
    {
      hint: "sinh hoat",
      keywords: ["an", "ăn", "uong", "uống", "com", "cơm", "tra sua", "trà sữa", "ca phe", "cà phê", "sinh hoat", "sinh hoạt"]
    },
    { hint: "quan cafe", keywords: ["quan cafe", "quán cafe", "cafe", "cà phê", "ca phe", "coffee"] },
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

function inferTransactionType(loweredPrompt) {
  if (includesAny(loweredPrompt, INCOME_KEYWORDS)) return "income";
  if (includesAny(loweredPrompt, EXPENSE_KEYWORDS)) return "expense";
  return "expense";
}

function inferSimpleDecision(prompt) {
  const lowered = prompt.toLowerCase();
  const normalized = lowered.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (includesAny(lowered, ANALYZE_KEYWORDS) || includesAny(normalized, ["phan tich", "so sanh", "xu huong", "bien dong"])) {
    return { skill: "analyzeSpending", args: {} };
  }

  const isReportQuestion = (
    includesAny(normalized, ["bao cao", "report", "thang nay", "thang truoc", "bao nhieu", "tong chi", "tong thu", "so voi"]) &&
    includesAny(normalized, ["chi", "thu", "chi tieu", "thu nhap", "an uong", "xang", "danh muc", "danh muc nao"])
  );

  if (includesAny(lowered, REPORT_KEYWORDS) || isReportQuestion) {
    const reportType = includesAny(normalized, ["danh muc", "danh muc nao", "theo danh muc"]) ? "category" : "monthly";
    const type = includesAny(normalized, ["thu nhap"]) ? "income" : includesAny(normalized, ["chi", "chi tieu", "an uong", "xang"]) ? "expense" : undefined;
    return { skill: "getReport", args: { reportType, type } };
  }

  return {
    skill: "createTransaction",
    args: {
      amount: parseAmount(prompt),
      type: inferTransactionType(lowered),
      date: parseDateFromPrompt(prompt),
      note: prompt,
      category_hint: extractCategoryHint(prompt),
      prompt_text: prompt
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
    args.date = parseDateFromPrompt(prompt);
    args.amount = parseAmount(prompt);
    if (!args.type) {
      args.type = inferTransactionType(prompt.toLowerCase());
    }
    if (!args.category_hint) {
      args.category_hint = extractCategoryHint(prompt);
    }
    if (!args.prompt_text) {
      args.prompt_text = prompt;
    }
  }

  return { skill, args };
}

async function inferWithOpenAI(prompt, systemPrompt) {
  const response = await openaiClient.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0
  });

  return response.output_text || "{}";
}

async function inferWithGoogle(prompt, systemPrompt) {
  return generateWithGoogleAI({
    systemPrompt,
    userPrompt: prompt
  });
}

export async function inferSkillFromPrompt(prompt) {
  const systemPrompt = [
    "You are a financial assistant.",
    "Return strict JSON only with keys: skill, args.",
    "skill must be one of: createTransaction, getReport, analyzeSpending.",
    "Do not include markdown or additional text."
  ].join(" ");

  if (!hasGoogleAI && !hasOpenAI) {
    return inferSimpleDecision(prompt);
  }

  try {
    let text = "{}";
    if (hasGoogleAI) {
      text = await inferWithGoogle(prompt, systemPrompt);
    } else {
      text = await inferWithOpenAI(prompt, systemPrompt);
    }

    const parsed = safeJsonParseDecision(text);
    return normalizeModelDecision(parsed, prompt);
  } catch {
    return inferSimpleDecision(prompt);
  }
}
