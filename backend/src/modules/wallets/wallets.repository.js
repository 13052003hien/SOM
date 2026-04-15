import { pool } from "../../config/database.js";

export async function listWalletsByUser({ userId, limit, offset, sortBy, sortOrder }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, name, balance, created_at, updated_at
     FROM wallets
     WHERE user_id = ?
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

export async function countWalletsByUser(userId) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM wallets WHERE user_id = ?", [userId]);
  return rows[0].total;
}

export async function createWallet({ userId, name, balance }) {
  const [result] = await pool.query(
    "INSERT INTO wallets (user_id, name, balance) VALUES (?, ?, ?)",
    [userId, name, balance]
  );
  return { id: result.insertId, user_id: userId, name, balance };
}

export async function updateWallet({ id, userId, payload }) {
  const fields = [];
  const values = [];

  if (payload.name !== undefined) {
    fields.push("name = ?");
    values.push(payload.name);
  }

  if (payload.balance !== undefined) {
    fields.push("balance = ?");
    values.push(payload.balance);
  }

  if (!fields.length) {
    const [rows] = await pool.query("SELECT id, user_id, name, balance FROM wallets WHERE id = ? AND user_id = ?", [id, userId]);
    return rows[0] || null;
  }

  values.push(id, userId);
  await pool.query(`UPDATE wallets SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);

  const [rows] = await pool.query("SELECT id, user_id, name, balance FROM wallets WHERE id = ? AND user_id = ?", [id, userId]);
  return rows[0] || null;
}

export async function deleteWallet({ id, userId }) {
  const [result] = await pool.query("DELETE FROM wallets WHERE id = ? AND user_id = ?", [id, userId]);
  return result.affectedRows > 0;
}
