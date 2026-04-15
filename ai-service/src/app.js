import cors from "cors";
import express from "express";
import { aiRouter } from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
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
