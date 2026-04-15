import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { HttpError } from "../utils/http-error.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "UNAUTHORIZED", "Missing or invalid access token"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (error) {
    return next(new HttpError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
}
