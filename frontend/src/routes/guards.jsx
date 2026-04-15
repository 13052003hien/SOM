import { Navigate, useLocation } from "react-router-dom";
import { authStore } from "../store/auth/auth.store";

export function RequireAuth({ children }) {
  const location = useLocation();
  const isAuthenticated = authStore.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function RequireGuest({ children }) {
  const isAuthenticated = authStore.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
