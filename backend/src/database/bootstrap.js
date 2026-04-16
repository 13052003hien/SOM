import { pool } from "../config/database.js";
import { defaultCategories } from "./default-categories.js";

async function getColumnNames(tableName) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function getTableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureCategoryColumns() {
  const tableExists = await getTableExists("categories");
  if (!tableExists) return;

  const columns = await getColumnNames("categories");

  if (!columns.has("scope")) {
    await pool.query("ALTER TABLE categories ADD COLUMN scope ENUM('system', 'custom') NOT NULL DEFAULT 'custom' AFTER user_id");
  }

  if (!columns.has("group_name")) {
    await pool.query("ALTER TABLE categories ADD COLUMN group_name VARCHAR(100) NULL AFTER scope");
  }

  await pool.query("ALTER TABLE categories MODIFY user_id BIGINT UNSIGNED NULL");
}

async function seedDefaultCategories() {
  const [rows] = await pool.query("SELECT type, group_name, name FROM categories WHERE scope = 'system'");
  const existingKeys = new Set(
    rows.map((row) => `${row.type}|${row.group_name || ""}|${row.name}`)
  );

  const missingValues = defaultCategories
    .filter((item) => !existingKeys.has(`${item.type}|${item.group_name || ""}|${item.name}`))
    .map((item) => [null, "system", item.group_name, item.name, item.type]);

  if (!missingValues.length) return;

  await pool.query("INSERT INTO categories (user_id, scope, group_name, name, type) VALUES ?", [missingValues]);
}

export async function bootstrapDatabase() {
  await ensureCategoryColumns();
  await seedDefaultCategories();
}