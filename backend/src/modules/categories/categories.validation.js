import { z } from "zod";

const bodyBase = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  group_name: z.string().min(1).max(100).optional()
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

export const listCategorySchema = z.object({
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional(),
    type: z.enum(["income", "expense"]).optional()
  }),
  body: z.object({})
});

export const createCategorySchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: bodyBase
});

export const updateCategorySchema = z.object({
  params: idParam,
  query: z.object({}),
  body: bodyBase.partial()
});

export const deleteCategorySchema = z.object({
  params: idParam,
  query: z.object({}),
  body: z.object({})
});
