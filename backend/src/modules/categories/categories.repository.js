import { pool } from "../../config/database.js";

export async function listCategoriesByUser({ userId, limit, offset, sortBy, sortOrder, type }) {
  const conditions = ["(scope = 'system' OR user_id = ?)"];
  const values = [userId];

  if (type) {
    conditions.push("type = ?");
    values.push(type);
  }

  const [rows] = await pool.query(
    `SELECT id, user_id, scope, group_name, name, type, created_at, updated_at
     FROM categories
     WHERE ${conditions.join(" AND ")}
     ORDER BY scope = 'system' DESC, ${sortBy} ${sortOrder}, group_name ASC, name ASC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );
  return rows;
}

export async function countCategoriesByUser(userId, type) {
  const conditions = ["(scope = 'system' OR user_id = ?)"];
  const values = [userId];

  if (type) {
    conditions.push("type = ?");
    values.push(type);
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM categories WHERE ${conditions.join(" AND ")}`,
    values
  );
  return rows[0].total;
}

export async function createCategory({ userId, name, type, group_name = null }) {
  const [result] = await pool.query(
    "INSERT INTO categories (user_id, scope, group_name, name, type) VALUES (?, 'custom', ?, ?, ?)",
    [userId, group_name, name, type]
  );
  return { id: result.insertId, user_id: userId, scope: "custom", group_name, name, type };
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

  if (payload.group_name !== undefined) {
    fields.push("group_name = ?");
    values.push(payload.group_name);
  }

  if (!fields.length) {
    const [rows] = await pool.query(
      "SELECT id, user_id, scope, group_name, name, type FROM categories WHERE id = ? AND user_id = ? AND scope = 'custom'",
      [id, userId]
    );
    return rows[0] || null;
  }

  values.push(id, userId);
  await pool.query(`UPDATE categories SET ${fields.join(", ")} WHERE id = ? AND user_id = ? AND scope = 'custom'`, values);

  const [rows] = await pool.query(
    "SELECT id, user_id, scope, group_name, name, type FROM categories WHERE id = ? AND user_id = ? AND scope = 'custom'",
    [id, userId]
  );
  return rows[0] || null;
}

export async function deleteCategory({ id, userId }) {
  const [result] = await pool.query("DELETE FROM categories WHERE id = ? AND user_id = ? AND scope = 'custom'", [id, userId]);
  return result.affectedRows > 0;
}
