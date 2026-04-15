import multer from "multer";
import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { exportExcelController, importExcelController } from "./excel.controller.js";
import { exportExcelSchema, importExcelSchema } from "./excel.validation.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const excelRouter = Router();

excelRouter.post("/import", requireAuth, upload.single("file"), validate(importExcelSchema), importExcelController);
excelRouter.get("/export", requireAuth, validate(exportExcelSchema), exportExcelController);
