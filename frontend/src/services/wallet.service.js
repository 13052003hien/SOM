import { api } from "./api";

export async function getWallets(params = {}) {
  const response = await api.get("/wallets", { params });
  return response.data;
}

export async function createWallet(payload) {
  const response = await api.post("/wallets", payload);
  return response.data.data;
}

export async function updateWallet(id, payload) {
  const response = await api.put(`/wallets/${id}`, payload);
  return response.data.data;
}

export async function deleteWallet(id) {
  const response = await api.delete(`/wallets/${id}`);
  return response.data.data;
}
