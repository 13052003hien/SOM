import { z } from "zod";
import { backendPost } from "../services/backend-client.service.js";

const createTransactionInputSchema = z.object({
  wallet_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1),
  note: z.string().optional().default("")
});

export const createTransactionSkill = {
  name: "createTransaction",
  description: "Create a transaction in backend from parsed natural language input",
  inputSchema: createTransactionInputSchema,
  async execute({ args, token }) {
    const parsed = createTransactionInputSchema.parse(args);
    const result = await backendPost("/transactions", token, parsed);
    return {
      success: true,
      data: result.data,
      meta: {
        skill: "createTransaction"
      }
    };
  }
};
