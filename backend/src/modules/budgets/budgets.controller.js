import { parsePagination } from "../../common/utils/pagination.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  createBudgetEntry,
  deleteBudgetEntry,
  listBudgets,
  updateBudgetEntry
} from "./budgets.service.js";

export async function listBudgetsController(req, res, next) {
  try {
    const pagination = parsePagination(req.validated.query);
    const result = await listBudgets({
      userId: req.auth.userId,
      month: req.validated.query.month,
      pagination
    });
    return sendSuccess(res, result.data, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function createBudgetController(req, res, next) {
  try {
    const data = await createBudgetEntry({ userId: req.auth.userId, payload: req.validated.body });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function updateBudgetController(req, res, next) {
  try {
    const data = await updateBudgetEntry({
      id: req.validated.params.id,
      userId: req.auth.userId,
      payload: req.validated.body
    });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteBudgetController(req, res, next) {
  try {
    const data = await deleteBudgetEntry({ id: req.validated.params.id, userId: req.auth.userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
