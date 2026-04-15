import { pool } from "../../config/database.js";

function normalizeBudgetRow(row) {
  const spentAmount = Number(row.spent_amount || 0);
  const limitAmount = Number(row.limit_amount || 0);
  const remainingAmount = limitAmount - spentAmount;

  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    month: row.month,
    limit_amount: limitAmount,
    spent_amount: spentAmount,
    remaining_amount: remainingAmount,
    usage_percent: limitAmount > 0 ? Number(((spentAmount / limitAmount) * 100).toFixed(2)) : 0,
    is_exceeded: spentAmount > limitAmount,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function listBudgetsByUser({ userId, month, limit, offset, sortBy, sortOrder }) {
  const filters = ["b.user_id = ?"];
  const values = [userId];

  if (month) {
    filters.push("b.month = ?");
    values.push(month);
  }

  const [rows] = await pool.query(
    `SELECT
       b.id,
       b.user_id,
       b.category_id,
       b.month,
       b.limit_amount,
       b.created_at,
       b.updated_at,
       COALESCE(SUM(t.amount), 0) AS spent_amount
     FROM budgets b
     LEFT JOIN transactions t
       ON t.user_id = b.user_id
      AND t.category_id = b.category_id
      AND t.type = 'expense'
      AND DATE_FORMAT(t.date, '%Y-%m') = b.month
     WHERE ${filters.join(" AND ")}
     GROUP BY b.id, b.user_id, b.category_id, b.month, b.limit_amount, b.created_at, b.updated_at
     ORDER BY b.${sortBy} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return rows.map(normalizeBudgetRow);
}

export async function countBudgetsByUser({ userId, month }) {
  const filters = ["user_id = ?"];
  const values = [userId];

  if (month) {
    filters.push("month = ?");
    values.push(month);
  }

  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM budgets WHERE ${filters.join(" AND ")}`, values);
  return rows[0].total;
}

export async function getCategoryByIdForUser({ userId, categoryId }) {
  const [rows] = await pool.query("SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?", [
    categoryId,
    userId
  ]);
  return rows[0] || null;
}

export async function getBudgetByIdWithUsage({ id, userId }) {
  const [rows] = await pool.query(
    `SELECT
       b.id,
       b.user_id,
       b.category_id,
       b.month,
       b.limit_amount,
       b.created_at,
       b.updated_at,
       COALESCE(SUM(t.amount), 0) AS spent_amount
     FROM budgets b
     LEFT JOIN transactions t
       ON t.user_id = b.user_id
      AND t.category_id = b.category_id
      AND t.type = 'expense'
      AND DATE_FORMAT(t.date, '%Y-%m') = b.month
     WHERE b.id = ? AND b.user_id = ?
     GROUP BY b.id, b.user_id, b.category_id, b.month, b.limit_amount, b.created_at, b.updated_at`,
    [id, userId]
  );

  if (!rows[0]) return null;
  return normalizeBudgetRow(rows[0]);
}

export async function createBudget({ userId, payload }) {
  const [result] = await pool.query(
    "INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, ?)",
    [userId, payload.category_id, payload.month, payload.limit_amount]
  );

  return getBudgetByIdWithUsage({ id: result.insertId, userId });
}

export async function updateBudget({ id, userId, payload }) {
  const fields = [];
  const values = [];

  const mapping = {
    category_id: payload.category_id,
    month: payload.month,
    limit_amount: payload.limit_amount
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (!fields.length) {
    const [rows] = await pool.query(
      "SELECT id, user_id, category_id, month, limit_amount FROM budgets WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return rows[0] || null;
  }

  values.push(id, userId);
  await pool.query(`UPDATE budgets SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);

  return getBudgetByIdWithUsage({ id, userId });
}

export async function deleteBudget({ id, userId }) {
  const [result] = await pool.query("DELETE FROM budgets WHERE id = ? AND user_id = ?", [id, userId]);
  return result.affectedRows > 0;
}
