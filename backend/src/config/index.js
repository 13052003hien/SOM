import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../../../.env");

dotenv.config({ path: rootEnvPath });
dotenv.config();

function parseCorsOrigins(value, env) {
  if (!value) {
    return env === "development" ? ["*"] : ["http://localhost:5173"];
  }

  const origins = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length) {
    return origins;
  }

  return env === "development" ? ["*"] : ["http://localhost:5173"];
}

const env = process.env.NODE_ENV || "development";

export const config = {
  env,
  port: Number(process.env.BACKEND_PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev_jwt_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "som_db"
  },
  corsOrigins: parseCorsOrigins(process.env.FRONTEND_ORIGIN, env)
};
