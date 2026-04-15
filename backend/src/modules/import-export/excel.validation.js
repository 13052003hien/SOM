import { z } from "zod";

export const importExcelSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({})
});

export const exportExcelSchema = z.object({
  params: z.object({}),
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    type: z.enum(["income", "expense"]).optional(),
    wallet_id: z.coerce.number().int().positive().optional(),
    category_id: z.coerce.number().int().positive().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional()
  }),
  body: z.object({})
});
