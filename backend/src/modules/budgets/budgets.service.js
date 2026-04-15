import { HttpError } from "../../common/utils/http-error.js";
import { buildPaginationMeta } from "../../common/utils/pagination.js";
import {
  countBudgetsByUser,
  createBudget,
  deleteBudget,
  getCategoryByIdForUser,
  listBudgetsByUser,
  updateBudget
} from "./budgets.repository.js";

export async function listBudgets({ userId, month, pagination }) {
  const [data, total] = await Promise.all([
    listBudgetsByUser({ userId, month, ...pagination }),
    countBudgetsByUser({ userId, month })
  ]);

  const exceededItems = data.filter((item) => item.is_exceeded);

  return {
    data,
    meta: {
      ...buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
      summary: {
        totalBudgets: data.length,
        exceededBudgets: exceededItems.length,
        warning: exceededItems.length > 0 ? "One or more budgets exceeded the limit" : null
      }
    }
  };
}

export async function createBudgetEntry({ userId, payload }) {
  const category = await getCategoryByIdForUser({ userId, categoryId: payload.category_id });
  if (!category) {
    throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  if (category.type !== "expense") {
    throw new HttpError(400, "INVALID_BUDGET_CATEGORY", "Budget can only be set for expense category");
  }

  return createBudget({ userId, payload });
}

export async function updateBudgetEntry({ id, userId, payload }) {
  if (payload.category_id !== undefined) {
    const category = await getCategoryByIdForUser({ userId, categoryId: payload.category_id });
    if (!category) {
      throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    if (category.type !== "expense") {
      throw new HttpError(400, "INVALID_BUDGET_CATEGORY", "Budget can only be set for expense category");
    }
  }

  const updated = await updateBudget({ id, userId, payload });
  if (!updated) throw new HttpError(404, "BUDGET_NOT_FOUND", "Budget not found");
  return updated;
}

export async function deleteBudgetEntry({ id, userId }) {
  const deleted = await deleteBudget({ id, userId });
  if (!deleted) throw new HttpError(404, "BUDGET_NOT_FOUND", "Budget not found");
  return { id };
}
