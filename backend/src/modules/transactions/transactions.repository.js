import { pool } from "../../config/database.js";

function executor(connection) {
  return connection || pool;
}

function resolveSortColumn(sortBy) {
  const mapping = {
    id: "t.id",
    amount: "t.amount",
    date: "t.date",
    created_at: "t.created_at",
    updated_at: "t.updated_at",
    type: "t.type"
  };
  return mapping[sortBy] || "t.created_at";
}

function buildTransactionFilterWhere({ userId, filters = {} }) {
  const conditions = ["t.user_id = ?"];
  const values = [userId];

  if (filters.type) {
    conditions.push("t.type = ?");
    values.push(filters.type);
  }

  if (filters.category_id) {
    conditions.push("t.category_id = ?");
    values.push(filters.category_id);
  }

  if (filters.date_from) {
    conditions.push("DATE(t.date) >= DATE(?)");
    values.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push("DATE(t.date) <= DATE(?)");
    values.push(filters.date_to);
  }

  if (filters.amount_min !== undefined) {
    conditions.push("t.amount >= ?");
    values.push(Number(filters.amount_min));
  }

  if (filters.amount_max !== undefined) {
    conditions.push("t.amount <= ?");
    values.push(Number(filters.amount_max));
  }

  if (filters.q) {
    const keyword = `%${String(filters.q).trim()}%`;
    conditions.push("(t.note LIKE ? OR c.name LIKE ? OR c.group_name LIKE ? OR w.name LIKE ?)");
    values.push(keyword, keyword, keyword, keyword);
  }

  return {
    whereSql: conditions.join(" AND "),
    values
  };
}

export async function listTransactionsByUser({ userId, filters, limit, offset, sortBy, sortOrder }) {
  const { whereSql, values } = buildTransactionFilterWhere({ userId, filters });
  const orderColumn = resolveSortColumn(sortBy);

  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.user_id,
      t.wallet_id,
      t.category_id,
      t.amount,
      t.type,
      DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
      t.note,
      t.created_at,
      t.updated_at
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN wallets w ON w.id = t.wallet_id
     WHERE ${whereSql}
     ORDER BY ${orderColumn} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
}

export async function countTransactionsByUser({ userId, filters }) {
  const { whereSql, values } = buildTransactionFilterWhere({ userId, filters });
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN wallets w ON w.id = t.wallet_id
     WHERE ${whereSql}`,
    values
  );
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
    "SELECT id, user_id, scope, group_name, name, type FROM categories WHERE id = ? AND (user_id = ? OR scope = 'system')",
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
    "SELECT id, user_id, wallet_id, category_id, amount, type, DATE_FORMAT(date, '%Y-%m-%d') AS date, note FROM transactions WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
}

export async function findTransactionByIdForUser({ connection, id, userId, forUpdate = false }) {
  const sql =
    "SELECT id, user_id, wallet_id, category_id, amount, type, DATE_FORMAT(date, '%Y-%m-%d') AS date, note FROM transactions WHERE id = ? AND user_id = ?" +
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
