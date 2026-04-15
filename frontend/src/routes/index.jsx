import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../pages/Auth/LoginPage";
import { RegisterPage } from "../pages/Auth/RegisterPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { TransactionsPage } from "../pages/Transactions/TransactionsPage";
import { WalletsPage } from "../pages/Wallets/WalletsPage";
import { CategoriesPage } from "../pages/Categories/CategoriesPage";
import { ReportsPage } from "../pages/Reports/ReportsPage";
import { SettingsPage } from "../pages/Settings/SettingsPage";
import { RequireAuth, RequireGuest } from "./guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={(
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        )}
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        element={(
          <RequireGuest>
            <AuthLayout />
          </RequireGuest>
        )}
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
