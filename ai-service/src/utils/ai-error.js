export function normalizeAIError(error) {
  if (error?.response?.data) {
    return {
      code: "BACKEND_API_ERROR",
      message: "Backend API request failed",
      details: error.response.data
    };
  }

  if (error?.name?.toLowerCase().includes("openai")) {
    return {
      code: "OPENAI_ERROR",
      message: "OpenAI request failed",
      details: null
    };
  }

  return {
    code: "AI_SERVICE_ERROR",
    message: "Unable to process request",
    details: null
  };
}
