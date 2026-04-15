import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/index.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import { sendSuccess } from "./common/utils/response.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  const allowAllOrigins = config.env !== "production" || config.corsOrigins.includes("*");

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow curl/postman or same-origin requests without Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowAllOrigins || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      }
    })
  );
  app.use(express.json());
  app.use(morgan(config.env === "production" ? "combined" : "dev"));

  app.get("/health", (req, res) => sendSuccess(res, { status: "ok", service: "backend" }));

  app.use("/api", apiRouter);

  app.use(errorMiddleware);

  return app;
}
