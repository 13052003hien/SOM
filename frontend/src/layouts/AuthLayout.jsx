import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px" }}>
      <div className="page-section" style={{ width: "min(420px, 100%)" }}>
        <Outlet />
      </div>
    </main>
  );
}
