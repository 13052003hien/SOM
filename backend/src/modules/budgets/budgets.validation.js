import { z } from "zod";

const idParam = z.object({ id: z.coerce.number().int().positive() });

const budgetBody = z.object({
  category_id: z.coerce.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  limit_amount: z.coerce.number().positive()
});

export const listBudgetSchema = z.object({
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional()
  }),
  body: z.object({})
});

export const createBudgetSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: budgetBody
});

export const updateBudgetSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: budgetBody.partial()
});

export const deleteBudgetSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: z.object({})
});
