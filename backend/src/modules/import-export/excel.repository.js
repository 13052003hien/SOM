import { pool } from "../../config/database.js";

export async function getWalletIdsByUser({ userId, walletIds }) {
  if (!walletIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id FROM wallets WHERE user_id = ? AND id IN (${walletIds.map(() => "?").join(",")})`,
    [userId, ...walletIds]
  );
  return rows.map((row) => Number(row.id));
}

export async function getCategoryIdsByUser({ userId, categoryIds }) {
  if (!categoryIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id FROM categories WHERE user_id = ? AND id IN (${categoryIds.map(() => "?").join(",")})`,
    [userId, ...categoryIds]
  );
  return rows.map((row) => Number(row.id));
}

export async function insertTransactionsBulk({ userId, rows }) {
  const values = rows.map((row) => [
    userId,
    row.wallet_id,
    row.category_id,
    row.amount,
    row.type,
    row.date,
    row.note || ""
  ]);

  const [result] = await pool.query(
    "INSERT INTO transactions (user_id, wallet_id, category_id, amount, type, date, note) VALUES ?",
    [values]
  );

  return result.affectedRows;
}

export async function listTransactionsForExport({ userId, filters }) {
  const conditions = ["t.user_id = ?"];
  const values = [userId];

  if (filters.month) {
    conditions.push("DATE_FORMAT(t.date, '%Y-%m') = ?");
    values.push(filters.month);
  }

  if (filters.type) {
    conditions.push("t.type = ?");
    values.push(filters.type);
  }

  if (filters.wallet_id) {
    conditions.push("t.wallet_id = ?");
    values.push(filters.wallet_id);
  }

  if (filters.category_id) {
    conditions.push("t.category_id = ?");
    values.push(filters.category_id);
  }

  if (filters.fromDate) {
    conditions.push("DATE(t.date) >= DATE(?)");
    values.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("DATE(t.date) <= DATE(?)");
    values.push(filters.toDate);
  }

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.wallet_id,
      w.name AS wallet_name,
      t.category_id,
      c.name AS category_name,
      t.amount,
      t.type,
      t.date,
      t.note
     FROM transactions t
     JOIN wallets w ON w.id = t.wallet_id
     JOIN categories c ON c.id = t.category_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY t.date DESC, t.id DESC`,
    values
  );

  return rows;
}
