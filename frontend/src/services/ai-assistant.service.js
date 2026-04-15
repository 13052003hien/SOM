import axios from "axios";

const runtimeAIBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000/ai`
    : "http://localhost:5000/ai";

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || runtimeAIBaseUrl;

const aiApi = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 12000
});

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("som_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      code: error?.response?.data?.error?.code || "AI_REQUEST_FAILED",
      message: error?.response?.data?.error?.message || "Không thể xử lý yêu cầu AI",
      details: error?.response?.data?.error?.details || null
    };

    return Promise.reject(normalized);
  }
);

export async function askAIAssistant(prompt) {
  const response = await aiApi.post("/ask", { prompt });
  return response.data;
}
