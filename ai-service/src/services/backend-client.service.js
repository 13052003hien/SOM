import axios from "axios";

const backendBaseURL = process.env.BACKEND_BASE_URL || "http://localhost:4000/api";

const http = axios.create({
  baseURL: backendBaseURL,
  timeout: 8000
});

function buildIpv4FallbackBaseURL(baseURL) {
  try {
    const url = new URL(baseURL);
    if (url.hostname !== "localhost") return null;
    url.hostname = "127.0.0.1";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function shouldRetryWithIpv4(error) {
  const host = error?.config?.baseURL;
  if (!host || !host.includes("localhost")) return false;

  const code = error?.code || error?.cause?.code;
  return ["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND", "ECONNRESET"].includes(code);
}

async function requestWithRetry(config, retries = 1) {
  try {
    return await http.request(config);
  } catch (error) {
    if (shouldRetryWithIpv4(error)) {
      const fallbackBaseURL = buildIpv4FallbackBaseURL(error.config.baseURL || backendBaseURL);
      if (fallbackBaseURL) {
        return http.request({
          ...config,
          baseURL: fallbackBaseURL
        });
      }
    }

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
