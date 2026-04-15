import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { categoryReportController, monthlyReportController } from "./reports.controller.js";
import { categoryReportSchema, monthlyReportSchema } from "./reports.validation.js";

export const reportsRouter = Router();

reportsRouter.get("/monthly", requireAuth, validate(monthlyReportSchema), monthlyReportController);
reportsRouter.get("/category", requireAuth, validate(categoryReportSchema), categoryReportController);
