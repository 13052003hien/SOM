import { HttpError } from "../../common/utils/http-error.js";
import { buildPaginationMeta } from "../../common/utils/pagination.js";
import {
  countCategoriesByUser,
  createCategory,
  deleteCategory,
  listCategoriesByUser,
  updateCategory
} from "./categories.repository.js";

export async function listCategories({ userId, pagination, type }) {
  const [data, total] = await Promise.all([
    listCategoriesByUser({ userId, type, ...pagination }),
    countCategoriesByUser(userId, type)
  ]);

  return { data, meta: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }) };
}

export async function createCategoryEntry({ userId, payload }) {
  return createCategory({ userId, ...payload });
}

export async function updateCategoryEntry({ id, userId, payload }) {
  const updated = await updateCategory({ id, userId, payload });
  if (!updated) throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return updated;
}

export async function deleteCategoryEntry({ id, userId }) {
  const deleted = await deleteCategory({ id, userId });
  if (!deleted) throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return { id };
}
