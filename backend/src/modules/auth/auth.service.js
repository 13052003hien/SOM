import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { HttpError } from "../../common/utils/http-error.js";
import { createUser, findUserByEmail } from "./auth.repository.js";

function signAccessToken(user) {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn
  });
}

export async function register(payload) {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new HttpError(409, "EMAIL_EXISTS", "Email already in use");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await createUser({ email: payload.email, passwordHash });
  const accessToken = signAccessToken(user);

  return {
    user: { id: user.id, email: user.email },
    accessToken
  };
}

export async function login(payload) {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const ok = await bcrypt.compare(payload.password, user.password);
  if (!ok) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const accessToken = signAccessToken(user);

  return {
    user: { id: user.id, email: user.email },
    accessToken
  };
}
