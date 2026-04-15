import { pool } from "../../config/database.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT id, email, password FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

export async function createUser({ email, passwordHash }) {
  const [result] = await pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, passwordHash]);
  return { id: result.insertId, email };
}
