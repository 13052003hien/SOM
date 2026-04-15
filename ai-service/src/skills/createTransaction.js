import { z } from "zod";
import { backendGet, backendPost } from "../services/backend-client.service.js";

const createTransactionInputSchema = z.object({
  wallet_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  date: z.string().optional(),
  note: z.string().optional().default(""),
  category_hint: z.string().optional()
});

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function toISODate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
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
      resolveWallet(token, parsed.wallet_id),
      resolveCategory(token, parsed.type, parsed.category_id, parsed.category_hint)
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
      meta: {
        skill: "createTransaction"
      }
    };
  }
};
