import { parsePagination } from "../../common/utils/pagination.js";
import { sendSuccess } from "../../common/utils/response.js";
import {
  createCategoryEntry,
  deleteCategoryEntry,
  listCategories,
  updateCategoryEntry
} from "./categories.service.js";

export async function listCategoriesController(req, res, next) {
  try {
    const pagination = parsePagination(req.validated.query);
    const result = await listCategories({ userId: req.auth.userId, pagination });
    return sendSuccess(res, result.data, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function createCategoryController(req, res, next) {
  try {
    const data = await createCategoryEntry({ userId: req.auth.userId, payload: req.validated.body });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function updateCategoryController(req, res, next) {
  try {
    const data = await updateCategoryEntry({
      id: req.validated.params.id,
      userId: req.auth.userId,
      payload: req.validated.body
    });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteCategoryController(req, res, next) {
  try {
    const data = await deleteCategoryEntry({ id: req.validated.params.id, userId: req.auth.userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
