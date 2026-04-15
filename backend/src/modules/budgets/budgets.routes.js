import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createBudgetController,
  deleteBudgetController,
  listBudgetsController,
  updateBudgetController
} from "./budgets.controller.js";
import {
  createBudgetSchema,
  deleteBudgetSchema,
  listBudgetSchema,
  updateBudgetSchema
} from "./budgets.validation.js";

export const budgetsRouter = Router();

budgetsRouter.get("/", requireAuth, validate(listBudgetSchema), listBudgetsController);
budgetsRouter.post("/", requireAuth, validate(createBudgetSchema), createBudgetController);
budgetsRouter.put("/:id", requireAuth, validate(updateBudgetSchema), updateBudgetController);
budgetsRouter.delete("/:id", requireAuth, validate(deleteBudgetSchema), deleteBudgetController);
