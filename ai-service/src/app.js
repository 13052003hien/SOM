import cors from "cors";
import express from "express";
import { aiRouter } from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  const env = process.env.NODE_ENV || "development";
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowAllOrigins = env !== "production" || allowedOrigins.includes("*");

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowAllOrigins || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      }
    })
  );
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ success: true, data: { status: "ok", service: "ai-service" } });
  });

  app.use("/ai", aiRouter);

  app.use((err, req, res, next) => {
    return res.status(500).json({
      success: false,
      error: {
        code: "AI_SERVICE_ERROR",
        message: "Unable to process request",
        details: null
      }
    });
  });

  return app;
}
