import { z } from "zod";

const createBody = z.object({
  name: z.string().min(1),
  balance: z.coerce.number().default(0)
});

const updateBody = z.object({
  name: z.string().min(1).optional(),
  balance: z.coerce.number().optional()
});

const idParam = z.object({ id: z.coerce.number().int().positive() });

export const listWalletSchema = z.object({
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional()
  }),
  body: z.object({})
});

export const createWalletSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: createBody
});

export const updateWalletSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: updateBody
});

export const deleteWalletSchema = z.object({
  params: idParam,
  query: z.object({}),
  body: z.object({})
});
