import { sendSuccess } from "../../common/utils/response.js";
import { exportExcelFile, importExcelFile } from "./excel.service.js";

export async function importExcelController(req, res, next) {
  try {
    const data = await importExcelFile({
      userId: req.auth.userId,
      fileBuffer: req.file?.buffer
    });

    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function exportExcelController(req, res, next) {
  try {
    const result = await exportExcelFile({
      userId: req.auth.userId,
      filters: req.validated.query
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=\"${result.fileName}\"`);
    res.setHeader("X-Export-Row-Count", String(result.totalRows));

    return res.send(result.fileBuffer);
  } catch (error) {
    return next(error);
  }
}
