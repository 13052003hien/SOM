import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/auth.service";
import { authStore } from "../../store/auth/auth.store";
import { useToast } from "../../store/toast/toast.store";

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onChange(event) {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const result = await register({ email: form.email, password: form.password });
      authStore.setSession({
        accessToken: result.accessToken,
        user: result.user
      });
      toast.success("Đăng ký thành công!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const errorMsg = err.message || "Đăng ký thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Tạo tài khoản</h2>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>Tạo tài khoản mới để bắt đầu quản lý chi tiêu.</p>

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

        <label>
          Xác nhận mật khẩu
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
      </form>

      <p style={{ marginBottom: 0 }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
