import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { budgetsRouter } from "../modules/budgets/budgets.routes.js";
import { categoriesRouter } from "../modules/categories/categories.routes.js";
import { excelRouter } from "../modules/import-export/excel.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { transactionsRouter } from "../modules/transactions/transactions.routes.js";
import { walletsRouter } from "../modules/wallets/wallets.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/wallets", walletsRouter);
apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/budgets", budgetsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/import-export", excelRouter);
