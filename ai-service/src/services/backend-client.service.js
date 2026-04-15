import axios from "axios";

const backendBaseURL = process.env.BACKEND_BASE_URL || "http://localhost:4000/api";

const http = axios.create({
  baseURL: backendBaseURL,
  timeout: 8000
});

async function requestWithRetry(config, retries = 1) {
  try {
    return await http.request(config);
  } catch (error) {
    if (retries > 0) {
      return requestWithRetry(config, retries - 1);
    }
    throw error;
  }
}

export async function backendGet(url, token, params = {}) {
  const response = await requestWithRetry({
    method: "GET",
    url,
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
}

export async function backendPost(url, token, data = {}) {
  const response = await requestWithRetry({
    method: "POST",
    url,
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
}
