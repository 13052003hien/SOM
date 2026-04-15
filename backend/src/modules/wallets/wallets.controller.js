import { parsePagination } from "../../common/utils/pagination.js";
import { sendSuccess } from "../../common/utils/response.js";
import { createWalletEntry, deleteWalletEntry, listWallets, updateWalletEntry } from "./wallets.service.js";

export async function listWalletsController(req, res, next) {
  try {
    const pagination = parsePagination(req.validated.query);
    const result = await listWallets({ userId: req.auth.userId, pagination });
    return sendSuccess(res, result.data, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function createWalletController(req, res, next) {
  try {
    const data = await createWalletEntry({ userId: req.auth.userId, payload: req.validated.body });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function updateWalletController(req, res, next) {
  try {
    const data = await updateWalletEntry({
      id: req.validated.params.id,
      userId: req.auth.userId,
      payload: req.validated.body
    });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteWalletController(req, res, next) {
  try {
    const data = await deleteWalletEntry({ id: req.validated.params.id, userId: req.auth.userId });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
