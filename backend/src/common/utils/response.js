export function sendSuccess(res, data, meta) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.json(payload);
}

export function sendError(res, statusCode, code, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
}
