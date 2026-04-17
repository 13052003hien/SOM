import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { authStore } from "../store/auth/auth.store";
import { useToast } from "../store/toast/toast.store";

const items = [
  { to: "/dashboard", label: "Tổng quan" },
  { to: "/transactions", label: "Giao dịch" },
  { to: "/wallets", label: "Ví tiền" },
  { to: "/categories", label: "Danh mục" },
  { to: "/reports", label: "Báo cáo" },
  { to: "/settings", label: "Cài đặt" }
];

export function MainLayout() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = authStore.getUser();

  function handleLogout() {
    authStore.clearSession();
    toast.success("Đăng xuất thành công!");
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <h1>SOM</h1>
        <p>Sổ tay chi tiêu thông minh</p>
        <ThemeToggle />
        {user?.email ? <p className="auth-user">{user.email}</p> : null}
        <nav>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>
      <main className="content-pane">
        <Outlet />
      </main>
    </div>
  );
}
