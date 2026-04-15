export function normalizeAIError(error) {
  if (error?.code === "AI_CLARIFICATION_NEEDED") {
    return {
      code: error.code,
      message: error.message || "Need more information to complete this request",
      details: error.details || null
    };
  }

  if (error?.response?.data) {
    const backendError = error.response.data?.error;
    return {
      code: "BACKEND_API_ERROR",
      message: backendError?.message || "Backend API request failed",
      details: backendError || error.response.data
    };
  }

  if (error?.name === "ZodError") {
    return {
      code: "AI_VALIDATION_ERROR",
      message: "Could not understand the request payload",
      details: error.issues || null
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
