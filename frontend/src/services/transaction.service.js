import { api } from "./api";

export async function getTransactions(params = {}) {
  const response = await api.get("/transactions", { params });
  return response.data;
}

export async function createTransaction(payload) {
  const response = await api.post("/transactions", payload);
  return response.data.data;
}

export async function updateTransaction(id, payload) {
  const response = await api.put(`/transactions/${id}`, payload);
  return response.data.data;
}

export async function deleteTransaction(id) {
  const response = await api.delete(`/transactions/${id}`);
  return response.data.data;
}
