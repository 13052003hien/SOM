import { Router } from "express";
import { validate } from "../../common/middleware/validate.middleware.js";
import { loginController, registerController } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), registerController);
authRouter.post("/login", validate(loginSchema), loginController);
