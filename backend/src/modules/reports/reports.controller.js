import { sendSuccess } from "../../common/utils/response.js";
import { getCategoryReport, getMonthlyReport } from "./reports.service.js";

export async function monthlyReportController(req, res, next) {
  try {
    const data = await getMonthlyReport({ userId: req.auth.userId, month: req.validated.query.month });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function categoryReportController(req, res, next) {
  try {
    const data = await getCategoryReport({
      userId: req.auth.userId,
      month: req.validated.query.month,
      type: req.validated.query.type
    });
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
