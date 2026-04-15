import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createTransactionController,
  deleteTransactionController,
  listTransactionsController,
  updateTransactionController
} from "./transactions.controller.js";
import {
  createTransactionSchema,
  deleteTransactionSchema,
  listTransactionSchema,
  updateTransactionSchema
} from "./transactions.validation.js";

export const transactionsRouter = Router();

transactionsRouter.get("/", requireAuth, validate(listTransactionSchema), listTransactionsController);
transactionsRouter.post("/", requireAuth, validate(createTransactionSchema), createTransactionController);
transactionsRouter.put("/:id", requireAuth, validate(updateTransactionSchema), updateTransactionController);
transactionsRouter.delete("/:id", requireAuth, validate(deleteTransactionSchema), deleteTransactionController);
