import { parsePagination } from "../../common/utils/pagination.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  createTransactionEntry,
  deleteTransactionEntry,
  listTransactions,
  updateTransactionEntry
} from "./transactions.service.js";

export async function listTransactionsController(req, res, next) {
  try {
    const pagination = parsePagination(req.validated.query);
    const result = await listTransactions({
      userId: req.auth.userId,
      pagination,
      filters: {
        q: req.validated.query.q,
        type: req.validated.query.type,
        category_id: req.validated.query.category_id,
        date_from: req.validated.query.date_from,
        date_to: req.validated.query.date_to,
        amount_min: req.validated.query.amount_min,
        amount_max: req.validated.query.amount_max
      }
    });
    return sendSuccess(res, result.data, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function createTransactionController(req, res, next) {
  try {
    const data = await createTransactionEntry({ userId: req.auth.userId, payload: req.validated.body });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function updateTransactionController(req, res, next) {
  try {
    const data = await updateTransactionEntry({
      id: req.validated.params.id,
      userId: req.auth.userId,
      payload: req.validated.body
    });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteTransactionController(req, res, next) {
  try {
    const data = await deleteTransactionEntry({ id: req.validated.params.id, userId: req.auth.userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
