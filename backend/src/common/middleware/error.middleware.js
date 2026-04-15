import { HttpError } from "../utils/http-error.js";
import { sendError } from "../utils/response.js";

export function errorMiddleware(err, req, res, next) {
  if (err instanceof HttpError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err?.name === "ZodError") {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", err.issues || []);
  }

  return sendError(res, 500, "INTERNAL_ERROR", "Unexpected server error", null);
}
