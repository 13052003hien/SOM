import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
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
  corsOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
};
