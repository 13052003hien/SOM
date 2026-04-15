import * as XLSX from "xlsx";
import { HttpError } from "../../common/utils/http-error.js";
import {
  getCategoryIdsByUser,
  getWalletIdsByUser,
  insertTransactionsBulk,
  listTransactionsForExport
} from "./excel.repository.js";

const requiredHeaders = ["wallet_id", "category_id", "amount", "type", "date"];

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function toISODate(value) {
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(parsed.y, parsed.m - 1, parsed.d);
    return date.toISOString().slice(0, 10);
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function mapAndValidateRows(rawRows) {
  const mapped = [];

  rawRows.forEach((row, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
    );

    const walletId = Number(normalizedRow.wallet_id ?? normalizedRow.walletid);
    const categoryId = Number(normalizedRow.category_id ?? normalizedRow.categoryid);
    const amount = Number(normalizedRow.amount);
    const type = String(normalizedRow.type || "").trim().toLowerCase();
    const date = toISODate(normalizedRow.date);
    const note = normalizedRow.note ? String(normalizedRow.note) : "";

    const hasInvalid =
      !Number.isInteger(walletId) ||
      walletId <= 0 ||
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["income", "expense"].includes(type) ||
      !date;

    if (hasInvalid) {
      throw new HttpError(400, "INVALID_EXCEL_ROW", "Excel contains invalid row data", {
        rowNumber: index + 2
      });
    }

    mapped.push({
      wallet_id: walletId,
      category_id: categoryId,
      amount,
      type,
      date,
      note
    });
  });

  return mapped;
}

export async function importExcelFile({ userId, fileBuffer }) {
  if (!fileBuffer) {
    throw new HttpError(400, "MISSING_FILE", "Excel file is required");
  }

  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new HttpError(400, "EMPTY_EXCEL", "Excel file has no worksheet");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  if (!rows.length) {
    throw new HttpError(400, "EMPTY_EXCEL", "Excel file has no data rows");
  }

  const firstHeaders = Object.keys(rows[0]).map(normalizeHeader);
  const missingHeaders = requiredHeaders.filter((header) => !firstHeaders.includes(header));
  if (missingHeaders.length) {
    throw new HttpError(400, "MISSING_EXCEL_HEADERS", "Excel is missing required headers", {
      missingHeaders
    });
  }

  const mappedRows = mapAndValidateRows(rows);

  const walletIds = [...new Set(mappedRows.map((row) => row.wallet_id))];
  const categoryIds = [...new Set(mappedRows.map((row) => row.category_id))];

  const [validWalletIds, validCategoryIds] = await Promise.all([
    getWalletIdsByUser({ userId, walletIds }),
    getCategoryIdsByUser({ userId, categoryIds })
  ]);

  const invalidWalletIds = walletIds.filter((id) => !validWalletIds.includes(id));
  const invalidCategoryIds = categoryIds.filter((id) => !validCategoryIds.includes(id));

  if (invalidWalletIds.length || invalidCategoryIds.length) {
    throw new HttpError(400, "INVALID_REFERENCE", "Excel contains wallet/category not owned by user", {
      invalidWalletIds,
      invalidCategoryIds
    });
  }

  const importedCount = await insertTransactionsBulk({ userId, rows: mappedRows });

  return {
    importedCount,
    totalRows: mappedRows.length
  };
}

export async function exportExcelFile({ userId, filters }) {
  const rows = await listTransactionsForExport({ userId, filters });

  const exportRows = rows.map((row) => ({
    id: row.id,
    wallet_id: row.wallet_id,
    wallet_name: row.wallet_name,
    category_id: row.category_id,
    category_name: row.category_name,
    amount: Number(row.amount),
    type: row.type,
    date: new Date(row.date).toISOString().slice(0, 10),
    note: row.note || ""
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "transactions");

  const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return {
    fileBuffer,
    fileName: `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`,
    totalRows: exportRows.length
  };
}
