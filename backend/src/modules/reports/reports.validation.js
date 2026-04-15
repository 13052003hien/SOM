import { z } from "zod";

export const monthlyReportSchema = z.object({
  params: z.object({}),
  query: z.object({ month: z.string().regex(/^\d{4}-\d{2}$/).optional() }),
  body: z.object({})
});

export const categoryReportSchema = z.object({
  params: z.object({}),
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    type: z.enum(["income", "expense"]).optional()
  }),
  body: z.object({})
});
