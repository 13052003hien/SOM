import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController
} from "./categories.controller.js";
import {
  createCategorySchema,
  deleteCategorySchema,
  listCategorySchema,
  updateCategorySchema
} from "./categories.validation.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", requireAuth, validate(listCategorySchema), listCategoriesController);
categoriesRouter.post("/", requireAuth, validate(createCategorySchema), createCategoryController);
categoriesRouter.put("/:id", requireAuth, validate(updateCategorySchema), updateCategoryController);
categoriesRouter.delete("/:id", requireAuth, validate(deleteCategorySchema), deleteCategoryController);
