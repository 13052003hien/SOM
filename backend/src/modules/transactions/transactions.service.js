import { HttpError } from "../../common/utils/http-error.js";
import { buildPaginationMeta } from "../../common/utils/pagination.js";
import { pool } from "../../config/database.js";
import {
  countTransactionsByUser,
  deleteTransaction,
  findTransactionByIdForUser,
  getCategoryByIdForUser,
  getWalletByIdForUser,
  insertTransaction,
  listTransactionsByUser,
  updateTransaction,
  updateWalletBalanceById
} from "./transactions.repository.js";

function signedAmount(type, amount) {
  return type === "income" ? Number(amount) : -Number(amount);
}

function ensureCategoryMatchesType(category, type) {
  if (category.type !== type) {
    throw new HttpError(400, "TYPE_MISMATCH", "Transaction type must match category type", {
      categoryType: category.type,
      transactionType: type
    });
  }
}

export async function listTransactions({ userId, pagination }) {
  const [data, total] = await Promise.all([
    listTransactionsByUser({ userId, ...pagination }),
    countTransactionsByUser(userId)
  ]);

  return { data, meta: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }) };
}

export async function createTransactionEntry({ userId, payload }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [wallet, category] = await Promise.all([
      getWalletByIdForUser({ connection, userId, walletId: payload.wallet_id, forUpdate: true }),
      getCategoryByIdForUser({ connection, userId, categoryId: payload.category_id })
    ]);

    if (!wallet) {
      throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
    }

    if (!category) {
      throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    ensureCategoryMatchesType(category, payload.type);

    const newBalance = Number(wallet.balance) + signedAmount(payload.type, payload.amount);
    await updateWalletBalanceById({ connection, walletId: wallet.id, balance: newBalance });

    const created = await insertTransaction({ connection, userId, payload });

    await connection.commit();
    return created;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTransactionEntry({ id, userId, payload }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await findTransactionByIdForUser({ connection, id, userId, forUpdate: true });
    if (!existing) {
      throw new HttpError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    const nextPayload = {
      wallet_id: payload.wallet_id ?? existing.wallet_id,
      category_id: payload.category_id ?? existing.category_id,
      amount: payload.amount ?? Number(existing.amount),
      type: payload.type ?? existing.type,
      date: payload.date ?? existing.date,
      note: payload.note ?? existing.note
    };

    const nextCategory = await getCategoryByIdForUser({
      connection,
      userId,
      categoryId: nextPayload.category_id
    });
    if (!nextCategory) {
      throw new HttpError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    ensureCategoryMatchesType(nextCategory, nextPayload.type);

    const oldWallet = await getWalletByIdForUser({
      connection,
      userId,
      walletId: existing.wallet_id,
      forUpdate: true
    });
    if (!oldWallet) {
      throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
    }

    if (nextPayload.wallet_id !== existing.wallet_id) {
      const newWallet = await getWalletByIdForUser({
        connection,
        userId,
        walletId: nextPayload.wallet_id,
        forUpdate: true
      });
      if (!newWallet) {
        throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
      }

      const oldWalletBalance = Number(oldWallet.balance) - signedAmount(existing.type, existing.amount);
      const newWalletBalance = Number(newWallet.balance) + signedAmount(nextPayload.type, nextPayload.amount);

      await updateWalletBalanceById({ connection, walletId: oldWallet.id, balance: oldWalletBalance });
      await updateWalletBalanceById({ connection, walletId: newWallet.id, balance: newWalletBalance });
    } else {
      const delta =
        signedAmount(nextPayload.type, nextPayload.amount) - signedAmount(existing.type, existing.amount);
      const updatedBalance = Number(oldWallet.balance) + delta;
      await updateWalletBalanceById({ connection, walletId: oldWallet.id, balance: updatedBalance });
    }

    const updated = await updateTransaction({ connection, id, userId, payload: nextPayload });

    await connection.commit();
    return updated;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTransactionEntry({ id, userId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await findTransactionByIdForUser({ connection, id, userId, forUpdate: true });
    if (!existing) {
      throw new HttpError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    const wallet = await getWalletByIdForUser({
      connection,
      userId,
      walletId: existing.wallet_id,
      forUpdate: true
    });
    if (!wallet) {
      throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
    }

    const revertedBalance = Number(wallet.balance) - signedAmount(existing.type, existing.amount);
    await updateWalletBalanceById({ connection, walletId: wallet.id, balance: revertedBalance });

    const deleted = await deleteTransaction({ connection, id, userId });
    if (!deleted) {
      throw new HttpError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    await connection.commit();
    return { id };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
