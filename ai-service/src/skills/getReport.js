import { z } from "zod";
import { backendGet } from "../services/backend-client.service.js";

const getReportInputSchema = z.object({
  reportType: z.enum(["monthly", "category"]),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(["income", "expense"]).optional()
});

export const getReportSkill = {
  name: "getReport",
  description: "Get monthly or category expense report from backend",
  inputSchema: getReportInputSchema,
  async execute({ args, token }) {
    const parsed = getReportInputSchema.parse(args);

    const url = parsed.reportType === "monthly" ? "/reports/monthly" : "/reports/category";
    const result = await backendGet(url, token, {
      month: parsed.month,
      type: parsed.type
    });

    return {
      success: true,
      data: result.data,
      meta: {
        skill: "getReport"
      }
    };
  }
};
