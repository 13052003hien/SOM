import { z } from "zod";

const idParam = z.object({ id: z.coerce.number().int().positive() });

const transactionBody = z.object({
  wallet_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1),
  note: z.string().optional().default("")
});

export const listTransactionSchema = z.object({
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional(),
    q: z.string().optional(),
    type: z.enum(["income", "expense"]).optional(),
    category_id: z.coerce.number().int().positive().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    amount_min: z.coerce.number().nonnegative().optional(),
    amount_max: z.coerce.number().nonnegative().optional()
  }),
  body: z.object({})
});

export const createTransactionSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: transactionBody
});

export const updateTransactionSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: transactionBody.partial()
});

export const deleteTransactionSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: z.object({})
});
