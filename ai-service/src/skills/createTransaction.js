import { z } from "zod";
import { backendGet, backendPost } from "../services/backend-client.service.js";

const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Ho_Chi_Minh";

function formatDateInTimeZone(date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

function getLocalDateString(date = new Date()) {
  return formatDateInTimeZone(date);
}

function parseFlexibleAmount(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value);
  }

  const text = String(value || "").toLowerCase();
  const stripped = text
    .replace(/ngay\s*\d{1,2}\s*thang\s*\d{1,2}(?:\s*nam\s*\d{2,4})?/gi, " ")
    .replace(/ngay\s*\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/gi, " ");

  const unitMatch = stripped.match(/(?:so tien|số tiền|tien|tiền|gia tri|giá trị)?[^\d]*(\d+[\d.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|trieu|triệu|vnd|đ|d)\b/i);
  const match = unitMatch || stripped.match(/(\d+[\d.,]*)\s*(k|nghin|nghìn|ngan|ngàn|tr|trieu|triệu|vnd|đ|d)\b/i);
  if (match) {
    const base = Number(String(match[1]).replace(/,/g, ".").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(base)) return Number.NaN;

    const unit = String(match[2] || "").toLowerCase();
    if (unit === "k" || unit === "nghin" || unit === "nghìn" || unit === "ngan" || unit === "ngàn") return Math.abs(base) * 1000;
    if (unit === "tr" || unit === "trieu" || unit === "triệu") return Math.abs(base) * 1000000;
    return Math.abs(base);
  }

  const fallbackNumbers = stripped.match(/\d+[\d.,]*/g) || [];
  if (fallbackNumbers.length) {
    const base = Number(String(fallbackNumbers[fallbackNumbers.length - 1]).replace(/,/g, ".").replace(/[^\d.]/g, ""));
    if (Number.isFinite(base)) return Math.abs(base);
  }

  return Number.NaN;
}

function parseRelativeDateLabel(value) {
  const lowered = String(value || "").toLowerCase();
  const normalized = normalizeText(lowered);
  const relaxed = normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  if (/\bhom\s+qua\b/.test(normalized) || /\bh\s*m\s+qua\b/.test(relaxed)) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return getLocalDateString(date);
  }

  if (/\bhom\s+kia\b/.test(normalized) || /\bh\s*m\s+kia\b/.test(relaxed)) {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    return getLocalDateString(date);
  }

  if (/\bhom\s+nay\b/.test(normalized) || /\bh\s*m\s+nay\b/.test(relaxed)) {
    return getLocalDateString();
  }

  const verboseDateMatch = normalized.match(/ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*nam\s*(\d{2,4}))?/i);
  if (verboseDateMatch) {
    const day = Number(verboseDateMatch[1]);
    const month = Number(verboseDateMatch[2]);
    const yearRaw = verboseDateMatch[3] ? Number(verboseDateMatch[3]) : new Date().getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

const createTransactionInputSchema = z.object({
  wallet_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  amount: z.preprocess((value) => parseFlexibleAmount(value), z.number().positive()),
  type: z.enum(["income", "expense"]),
  date: z.string().nullish().transform((value) => value ?? undefined),
  note: z.string().nullish().transform((value) => value ?? ""),
  category_hint: z.string().nullish().transform((value) => value ?? undefined),
  prompt_text: z.string().nullish().transform((value) => value ?? undefined)
});

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function includesAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function aliasScore(text, aliases) {
  return aliases.some((alias) => text.includes(alias)) ? 1 : 0;
}

function toISODate(value) {
  if (!value) return getLocalDateString();

  const relativeDate = parseRelativeDateLabel(value);
  if (relativeDate) return relativeDate;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const dmyMatch = String(value).match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const yearRaw = dmyMatch[3] ? Number(dmyMatch[3]) : new Date().getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const verboseDateMatch = String(value).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").match(/ngay\s*(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*nam\s*(\d{2,4}))?/i);
  if (verboseDateMatch) {
    const day = Number(verboseDateMatch[1]);
    const month = Number(verboseDateMatch[2]);
    const yearRaw = verboseDateMatch[3] ? Number(verboseDateMatch[3]) : new Date().getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return getLocalDateString();
  }

  return getLocalDateString(parsed);
}

function buildClarificationError(message, details = null) {
  const error = new Error(message);
  error.code = "AI_CLARIFICATION_NEEDED";
  error.details = details;
  return error;
}

async function resolveWallet(token, preferredWalletId) {
  const walletsResponse = await backendGet("/wallets", token, { page: 1, limit: 100 });
  const wallets = Array.isArray(walletsResponse?.data) ? walletsResponse.data : [];

  if (!wallets.length) {
    throw buildClarificationError("No wallet found. Please create a wallet first.");
  }

  if (preferredWalletId) {
    const matched = wallets.find((wallet) => Number(wallet.id) === Number(preferredWalletId));
    if (matched) return matched;
  }

  return wallets[0];
}

function scoreWallet(wallet, promptText) {
  const promptNorm = normalizeText(promptText);
  const walletNorm = normalizeText(wallet.name);

  let score = 0;

  if (promptNorm.includes(walletNorm)) {
    score += 8;
  }

  const tokens = tokenize(wallet.name);
  for (const token of tokens) {
    if (promptNorm.includes(token)) score += 2;
  }

  if (includesAny(promptNorm, ["tien mat", "tiền mặt", "cash"]) && includesAny(walletNorm, ["tien mat", "cash"])) {
    score += 6;
  }

  if (
    includesAny(promptNorm, ["ngan hang", "ngân hàng", "bank", "the", "thẻ", "chuyen khoan", "chuyển khoản"]) &&
    includesAny(walletNorm, ["ngan hang", "ngân hàng", "bank", "the", "thẻ"])
  ) {
    score += 6;
  }

  return score;
}

function pickBestWallet(wallets, promptText) {
  if (!promptText) return wallets[0];

  let best = wallets[0];
  let bestScore = -1;

  for (const wallet of wallets) {
    const score = scoreWallet(wallet, promptText);
    if (score > bestScore) {
      best = wallet;
      bestScore = score;
    }
  }

  return best;
}

async function resolveCategory(token, type, preferredCategoryId, categoryHint) {
  const categoriesResponse = await backendGet("/categories", token, {
    page: 1,
    limit: 100,
    type
  });
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];

  if (!categories.length) {
    throw buildClarificationError(`No ${type} category found. Please create one first.`);
  }

  if (preferredCategoryId) {
    const matched = categories.find((category) => Number(category.id) === Number(preferredCategoryId));
    if (matched) return matched;
  }

  if (categoryHint) {
    const hint = normalizeText(categoryHint);
    const matchedByName = categories.find((category) => normalizeText(category.name).includes(hint));
    if (matchedByName) return matchedByName;
  }

  return categories[0];
}

function scoreCategory(category, promptText, categoryHint) {
  const promptNorm = normalizeText(promptText);
  const categoryNorm = normalizeText(category.name);
  const promptTokens = tokenize(promptText);
  const categoryTokens = tokenize(category.name);
  const groupNorm = normalizeText(category.group_name);
  const groupTokens = tokenize(category.group_name);
  const aliases = {
    cafe: ["quan cafe", "cafe", "ca phe", "coffee", "quan ca phe", "quan coffee"],
    meal: ["an", "an uong", "an sang", "an trua", "an toi", "uong", "com", "do an", "sinh hoat", "sinh hoat"],
    fuel: ["xang", "xang xe", "do xe", "xe co", "xe may"],
    work: ["di lam", "luong", "thu nhap", "salary", "nhan luong", "tien luong"],
    transfer: ["chuyen khoan", "ngan hang", "bank", "the", "theo chuyen khoan"]
  };

  let score = 0;

  if (promptNorm.includes(categoryNorm)) {
    score += 8;
  }

  if (groupNorm && promptNorm.includes(groupNorm)) {
    score += 4;
  }

  for (const token of categoryTokens) {
    if (promptTokens.includes(token)) {
      score += 2;
    }
  }

  for (const token of groupTokens) {
    if (promptTokens.includes(token)) {
      score += 1;
    }
  }

  if (categoryHint) {
    const hintNorm = normalizeText(categoryHint);
    if (categoryNorm.includes(hintNorm) || hintNorm.includes(categoryNorm) || (groupNorm && groupNorm.includes(hintNorm))) {
      score += 6;
    }
  }

  if (aliasScore(promptNorm, aliases.cafe) && aliasScore(categoryNorm, aliases.cafe)) {
    score += 10;
  }

  if (
    aliasScore(promptNorm, aliases.meal) &&
    aliasScore(categoryNorm, aliases.meal)
  ) {
    score += 8;
  }

  if (aliasScore(promptNorm, aliases.fuel) && aliasScore(categoryNorm, aliases.fuel)) {
    score += 8;
  }

  if (aliasScore(promptNorm, aliases.work) && aliasScore(categoryNorm, aliases.work)) {
    score += 8;
  }

  if (aliasScore(promptNorm, aliases.transfer) && aliasScore(categoryNorm, aliases.transfer)) {
    score += 8;
  }

  return score;
}

function pickBestCategory(categories, promptText, categoryHint) {
  if (!promptText && !categoryHint) return categories[0];

  let best = categories[0];
  let bestScore = -1;

  for (const category of categories) {
    const score = scoreCategory(category, promptText || "", categoryHint || "");
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }

  return best;
}

async function resolveWalletFromPrompt(token, preferredWalletId, promptText) {
  const walletsResponse = await backendGet("/wallets", token, { page: 1, limit: 100 });
  const wallets = Array.isArray(walletsResponse?.data) ? walletsResponse.data : [];

  if (!wallets.length) {
    throw buildClarificationError("No wallet found. Please create a wallet first.");
  }

  if (preferredWalletId) {
    const matched = wallets.find((wallet) => Number(wallet.id) === Number(preferredWalletId));
    if (matched) return matched;
  }

  return pickBestWallet(wallets, promptText);
}

async function resolveCategoryFromPrompt(token, type, preferredCategoryId, categoryHint, promptText) {
  const categoriesResponse = await backendGet("/categories", token, {
    page: 1,
    limit: 100,
    type
  });
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];

  if (!categories.length) {
    throw buildClarificationError(`No ${type} category found. Please create one first.`);
  }

  if (preferredCategoryId) {
    const matched = categories.find((category) => Number(category.id) === Number(preferredCategoryId));
    if (matched) return matched;
  }

  if (categoryHint) {
    const hint = normalizeText(categoryHint);
    const matchedByName = categories.find((category) => normalizeText(category.name).includes(hint));
    if (matchedByName) return matchedByName;
  }

  return pickBestCategory(categories, promptText, categoryHint);
}

export const createTransactionSkill = {
  name: "createTransaction",
  description: "Create a transaction in backend from parsed natural language input",
  inputSchema: createTransactionInputSchema,
  async execute({ args, token }) {
    if (!token) {
      throw buildClarificationError("Authentication required. Please sign in again.");
    }

    const parsed = createTransactionInputSchema.parse(args);

    const [wallet, category] = await Promise.all([
      resolveWalletFromPrompt(token, parsed.wallet_id, parsed.prompt_text || parsed.note),
      resolveCategoryFromPrompt(
        token,
        parsed.type,
        parsed.category_id,
        parsed.category_hint,
        parsed.prompt_text || parsed.note
      )
    ]);

    const payload = {
      wallet_id: Number(wallet.id),
      category_id: Number(category.id),
      amount: Number(parsed.amount),
      type: parsed.type,
      date: toISODate(parsed.date),
      note: parsed.note || ""
    };

    const result = await backendPost("/transactions", token, payload);

    return {
      success: true,
      data: result.data,
      context: {
        walletName: wallet.name,
        categoryName: category.group_name ? `${category.group_name} / ${category.name}` : category.name,
        transactionType: parsed.type,
        transactionDate: payload.date,
        amount: payload.amount,
        note: payload.note
      },
      meta: {
        skill: "createTransaction"
      }
    };
  }
};
