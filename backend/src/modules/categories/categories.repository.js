import { pool } from "../../config/database.js";

export async function listCategoriesByUser({ userId, limit, offset, sortBy, sortOrder }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, name, type, created_at, updated_at
     FROM categories
     WHERE user_id = ?
     ORDER BY ${sortBy} ${sortOrder}
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

export async function countCategoriesByUser(userId) {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM categories WHERE user_id = ?", [userId]);
  return rows[0].total;
}

export async function createCategory({ userId, name, type }) {
  const [result] = await pool.query(
    "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)",
    [userId, name, type]
  );
  return { id: result.insertId, user_id: userId, name, type };
}

export async function updateCategory({ id, userId, payload }) {
  const fields = [];
  const values = [];

  if (payload.name !== undefined) {
    fields.push("name = ?");
    values.push(payload.name);
  }

  if (payload.type !== undefined) {
    fields.push("type = ?");
    values.push(payload.type);
  }

  if (!fields.length) {
    const [rows] = await pool.query("SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?", [id, userId]);
    return rows[0] || null;
  }

  values.push(id, userId);
  await pool.query(`UPDATE categories SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);

  const [rows] = await pool.query("SELECT id, user_id, name, type FROM categories WHERE id = ? AND user_id = ?", [id, userId]);
  return rows[0] || null;
}

export async function deleteCategory({ id, userId }) {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ? AND user_id = ?", [id, userId]);
  return result.affectedRows > 0;
}
