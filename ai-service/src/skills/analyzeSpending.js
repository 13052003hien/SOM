import { z } from "zod";
import { backendGet } from "../services/backend-client.service.js";

const analyzeInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  compareWithPreviousMonth: z.boolean().optional().default(true)
});

function previousMonth(month) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 2, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const analyzeSpendingSkill = {
  name: "analyzeSpending",
  description: "Analyze spending trend by comparing monthly reports",
  inputSchema: analyzeInputSchema,
  async execute({ args, token }) {
    const parsed = analyzeInputSchema.parse(args);
    const targetMonth = parsed.month || getCurrentMonth();

    const current = await backendGet("/reports/monthly", token, { month: targetMonth });

    let comparison = null;
    if (parsed.compareWithPreviousMonth) {
      const prevMonth = previousMonth(targetMonth);
      const previous = await backendGet("/reports/monthly", token, { month: prevMonth });

      comparison = {
        month: targetMonth,
        previousMonth: prevMonth,
        expenseDelta: current.data.totalExpense - previous.data.totalExpense,
        incomeDelta: current.data.totalIncome - previous.data.totalIncome
      };
    }

    return {
      success: true,
      data: {
        current: current.data,
        comparison
      },
      meta: {
        skill: "analyzeSpending"
      }
    };
  }
};
