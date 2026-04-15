import { pool } from "../../config/database.js";

export async function getMonthlySummary({ userId, month }) {
  const [incomeRows] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = ?
       AND type = 'income'
       AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, month]
  );

  const [expenseRows] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = ?
       AND type = 'expense'
       AND DATE_FORMAT(date, '%Y-%m') = ?`,
    [userId, month]
  );

  return {
    month,
    totalIncome: Number(incomeRows[0].total),
    totalExpense: Number(expenseRows[0].total)
  };
}

export async function getCategorySummary({ userId, month, type }) {
  const filters = ["t.user_id = ?", "DATE_FORMAT(t.date, '%Y-%m') = ?"];
  const values = [userId, month];

  if (type) {
    filters.push("t.type = ?");
    values.push(type);
  }

  const [rows] = await pool.query(
    `SELECT c.id AS category_id, c.name AS category_name, c.type, COALESCE(SUM(t.amount), 0) AS total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE ${filters.join(" AND ")}
     GROUP BY c.id, c.name, c.type
     ORDER BY total DESC`,
    values
  );

  return rows.map((row) => ({
    category_id: row.category_id,
    category_name: row.category_name,
    type: row.type,
    total: Number(row.total)
  }));
}

export async function getDailySummary({ userId, month }) {
  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(date, '%Y-%m-%d') AS label,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE user_id = ?
       AND DATE_FORMAT(date, '%Y-%m') = ?
     GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
     ORDER BY label ASC`,
    [userId, month]
  );

  return rows.map((row) => ({
    label: row.label,
    income: Number(row.income),
    expense: Number(row.expense),
    net: Number(row.income) - Number(row.expense)
  }));
}

export async function getBudgetUsageByMonth({ userId, month }) {
  const [rows] = await pool.query(
    `SELECT
       b.id,
       b.category_id,
       c.name AS category_name,
       b.month,
       b.limit_amount,
       COALESCE(SUM(t.amount), 0) AS spent_amount
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t
       ON t.user_id = b.user_id
      AND t.category_id = b.category_id
      AND t.type = 'expense'
      AND DATE_FORMAT(t.date, '%Y-%m') = b.month
     WHERE b.user_id = ?
       AND b.month = ?
     GROUP BY b.id, b.category_id, c.name, b.month, b.limit_amount
     ORDER BY spent_amount DESC`,
    [userId, month]
  );

  return rows.map((row) => {
    const limitAmount = Number(row.limit_amount);
    const spentAmount = Number(row.spent_amount);
    const exceededBy = Math.max(0, spentAmount - limitAmount);

    return {
      id: row.id,
      category_id: row.category_id,
      category_name: row.category_name,
      month: row.month,
      limit_amount: limitAmount,
      spent_amount: spentAmount,
      remaining_amount: limitAmount - spentAmount,
      usage_percent: limitAmount > 0 ? Number(((spentAmount / limitAmount) * 100).toFixed(2)) : 0,
      is_exceeded: spentAmount > limitAmount,
      exceeded_by: exceededBy
    };
  });
}
