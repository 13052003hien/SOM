import axios from "axios";
import { authStore } from "../store/auth/auth.store";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("som_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      authStore.clearSession();

      if (typeof window !== "undefined") {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const isAuthPage = ["/login", "/register"].includes(window.location.pathname);

        if (!isAuthPage) {
          const next = encodeURIComponent(currentPath);
          window.location.replace(`/login?next=${next}`);
        }
      }
    }

    const normalized = {
      code: error?.response?.data?.error?.code || "NETWORK_ERROR",
      message: error?.response?.data?.error?.message || "Đã có lỗi xảy ra",
      details: error?.response?.data?.error?.details || null
    };
    return Promise.reject(normalized);
  }
);
