import {
  getBudgetUsageByMonth,
  getCategorySummary,
  getDailySummary,
  getMonthlySummary
} from "./reports.repository.js";

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toPieSeries(items) {
  const total = items.reduce((sum, item) => sum + Number(item.total), 0);

  return items.map((item) => ({
    id: item.category_id,
    label: item.category_name,
    value: Number(item.total),
    type: item.type,
    percentage: total > 0 ? Number(((Number(item.total) / total) * 100).toFixed(2)) : 0
  }));
}

export async function getMonthlyReport({ userId, month }) {
  const targetMonth = month || getCurrentMonth();
  const previousMonth = getPreviousMonth(targetMonth);

  const [current, previous, categoryExpense, dailyBar, budgetUsage] = await Promise.all([
    getMonthlySummary({ userId, month: targetMonth }),
    getMonthlySummary({ userId, month: previousMonth }),
    getCategorySummary({ userId, month: targetMonth, type: "expense" }),
    getDailySummary({ userId, month: targetMonth }),
    getBudgetUsageByMonth({ userId, month: targetMonth })
  ]);

  const currentNet = current.totalIncome - current.totalExpense;
  const previousNet = previous.totalIncome - previous.totalExpense;

  const exceededBudgets = budgetUsage.filter((item) => item.is_exceeded);
  const pieSeries = toPieSeries(categoryExpense);

  return {
    month: targetMonth,
    totalIncome: current.totalIncome,
    totalExpense: current.totalExpense,
    net: currentNet,
    previousMonth: {
      month: previousMonth,
      totalIncome: previous.totalIncome,
      totalExpense: previous.totalExpense,
      net: previousNet
    },
    comparison: {
      incomeDelta: current.totalIncome - previous.totalIncome,
      expenseDelta: current.totalExpense - previous.totalExpense,
      netDelta: currentNet - previousNet
    },
    charts: {
      pie: pieSeries,
      bar: dailyBar
    },
    budget: {
      totalBudgets: budgetUsage.length,
      exceededBudgets: exceededBudgets.length,
      alerts: exceededBudgets
    }
  };
}

export async function getCategoryReport({ userId, month, type }) {
  const targetMonth = month || getCurrentMonth();
  const data = await getCategorySummary({ userId, month: targetMonth, type });

  return {
    month: targetMonth,
    type: type || "all",
    breakdown: data,
    charts: {
      pie: toPieSeries(data),
      bar: data.map((item) => ({
        label: item.category_name,
        value: Number(item.total),
        type: item.type
      }))
    }
  };
}
