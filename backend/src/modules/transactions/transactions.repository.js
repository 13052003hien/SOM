import { pool } from "../../config/database.js";

function executor(connection) {
  return connection || pool;
}

export async function listTransactionsByUser({ userId, limit, offset, sortBy, sortOrder }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, wallet_id, category_id, amount, type, date, note, created_at, updated_at
     FROM transactions
     WHERE user_id = ?
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

export async function countTransactionsByUser(userId) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM transactions WHERE user_id = ?", [userId]);
  return rows[0].total;
}

export async function getWalletByIdForUser({ connection, userId, walletId, forUpdate = false }) {
  const sql =
    "SELECT id, user_id, name, balance FROM wallets WHERE id = ? AND user_id = ?" +
    (forUpdate ? " FOR UPDATE" : "");
  const [rows] = await executor(connection).query(sql, [walletId, userId]);
  return rows[0] || null;
}

export async function getCategoryByIdForUser({ connection, userId, categoryId }) {
  const [rows] = await executor(connection).query(
    "SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?",
    [categoryId, userId]
  );
  return rows[0] || null;
}

export async function insertTransaction({ connection, userId, payload }) {
  const [result] = await executor(connection).query(
    "INSERT INTO transactions (user_id, wallet_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, payload.wallet_id, payload.category_id, payload.amount, payload.type, payload.date, payload.note || ""]
  );

  const [rows] = await executor(connection).query(
    "SELECT id, user_id, wallet_id, category_id, amount, type, date, note FROM transactions WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
}

export async function findTransactionByIdForUser({ connection, id, userId, forUpdate = false }) {
  const sql =
    "SELECT id, user_id, wallet_id, category_id, amount, type, date, note FROM transactions WHERE id = ? AND user_id = ?" +
    (forUpdate ? " FOR UPDATE" : "");
  const [rows] = await executor(connection).query(sql, [id, userId]);
  return rows[0] || null;
}

export async function updateWalletBalanceById({ connection, walletId, balance }) {
  await executor(connection).query("UPDATE wallets SET balance = ? WHERE id = ?", [balance, walletId]);
}

export async function updateTransaction({ connection, id, userId, payload }) {
  const fields = [];
  const values = [];

  const mapping = {
    wallet_id: payload.wallet_id,
    category_id: payload.category_id,
    amount: payload.amount,
    type: payload.type,
    date: payload.date,
    note: payload.note
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (!fields.length) {
    return findTransactionByIdForUser({ connection, id, userId });
  }

  values.push(id, userId);
  await executor(connection).query(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);

  return findTransactionByIdForUser({ connection, id, userId });
}

export async function deleteTransaction({ connection, id, userId }) {
  const [result] = await executor(connection).query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, userId]);
  return result.affectedRows > 0;
}
