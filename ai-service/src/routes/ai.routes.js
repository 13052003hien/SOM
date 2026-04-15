import { Router } from "express";
import { runCopilotController } from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.post("/ask", runCopilotController);
