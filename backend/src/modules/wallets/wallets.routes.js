import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createWalletController,
  deleteWalletController,
  listWalletsController,
  updateWalletController
} from "./wallets.controller.js";
import {
  createWalletSchema,
  deleteWalletSchema,
  listWalletSchema,
  updateWalletSchema
} from "./wallets.validation.js";

export const walletsRouter = Router();

walletsRouter.get("/", requireAuth, validate(listWalletSchema), listWalletsController);
walletsRouter.post("/", requireAuth, validate(createWalletSchema), createWalletController);
walletsRouter.put("/:id", requireAuth, validate(updateWalletSchema), updateWalletController);
walletsRouter.delete("/:id", requireAuth, validate(deleteWalletSchema), deleteWalletController);
