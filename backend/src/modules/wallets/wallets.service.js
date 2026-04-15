import { HttpError } from "../../common/utils/http-error.js";
import { buildPaginationMeta } from "../../common/utils/pagination.js";
import {
  countWalletsByUser,
  createWallet,
  deleteWallet,
  listWalletsByUser,
  updateWallet
} from "./wallets.repository.js";

export async function listWallets({ userId, pagination }) {
  const [data, total] = await Promise.all([
    listWalletsByUser({ userId, ...pagination }),
    countWalletsByUser(userId)
  ]);

  return { data, meta: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }) };
}

export async function createWalletEntry({ userId, payload }) {
  return createWallet({ userId, ...payload });
}

export async function updateWalletEntry({ id, userId, payload }) {
  const updated = await updateWallet({ id, userId, payload });
  if (!updated) throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
  return updated;
}

export async function deleteWalletEntry({ id, userId }) {
  const deleted = await deleteWallet({ id, userId });
  if (!deleted) throw new HttpError(404, "WALLET_NOT_FOUND", "Wallet not found");
  return { id };
}
