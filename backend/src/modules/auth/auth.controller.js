import { sendSuccess } from "../../common/utils/response.js";
import { login, register } from "./auth.service.js";

export async function registerController(req, res, next) {
  try {
    const result = await register(req.validated.body);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await login(req.validated.body);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}
