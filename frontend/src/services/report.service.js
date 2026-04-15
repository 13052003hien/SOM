import { api } from "./api";

export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyReport(month) {
  const response = await api.get("/reports/monthly", { params: { month } });
  return response.data.data;
}

export async function getCategoryReport(month, type) {
  const response = await api.get("/reports/category", { params: { month, type } });
  return response.data.data;
}
