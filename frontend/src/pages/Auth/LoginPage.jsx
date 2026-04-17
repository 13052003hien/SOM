import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import { authStore } from "../../store/auth/auth.store";
import { useToast } from "../../store/toast/toast.store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = new URLSearchParams(location.search).get("next");
  const fromPath = nextPath || location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(form);
      authStore.setSession({
        accessToken: result.accessToken,
        user: result.user
      });
      toast.success("Đăng nhập thành công!");
      navigate(fromPath, { replace: true });
    } catch (err) {
      const errorMsg = err.message || "Đăng nhập thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function onChange(event) {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  }

  return (
    <>
      <h2 className="auth-title">Đăng nhập</h2>
      <p className="auth-subtitle">Đăng nhập để sử dụng hệ thống quản lý chi tiêu.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="bạn@example.com"
            required
          />
        </label>

        <label>
          Mật khẩu
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="auth-switch">
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </p>
    </>
  );
}
