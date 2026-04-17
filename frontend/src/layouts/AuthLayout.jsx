import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/common/ThemeToggle";
import nightclubVisual from "../assets/nightclub-visual.svg";

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <div className="auth-shell-glow auth-shell-glow-left" aria-hidden="true" />
      <div className="auth-shell-glow auth-shell-glow-right" aria-hidden="true" />
      <ThemeToggle className="auth-theme-toggle" />
      <section className="auth-sidebar">
        <div className="auth-intro">
          <p className="auth-intro-kicker">GIAO DIỆN NEON CỦA SOM</p>
          <h1>Sổ tay chi tiêu mang chất hiện đại.</h1>
          <p>
            Truy cập nhanh, theo dõi rõ ràng và cảm giác hiện đại hơn cho login/register.
          </p>
        </div>

        <div className="auth-visual-card" aria-hidden="true">
          <div className="auth-visual-orb auth-visual-orb-a" />
          <div className="auth-visual-orb auth-visual-orb-b" />
          <div className="auth-visual-grid" />
          <img className="auth-visual-image" src={nightclubVisual} alt="" />
          <div className="auth-visual-copy">
            <p className="auth-visual-kicker">CHÀO MỪNG BẠN ĐẾN VỚI SOM</p>
            <h2>BẮT ĐẦU QUẢN LÝ NGAY</h2>
            <p>
              Quản lý tiền bạc trong một không gian tối, tương phản cao, glow mềm và cảm giác như một poster nightclub.
            </p>
          </div>
          <div className="auth-visual-pills">
            <span>Neon</span>
            <span>Tập trung</span>
            <span>Mượt mà</span>
          </div>
        </div>
      </section>
      <div className="page-section auth-panel">
        <Outlet />
      </div>
    </main>
  );
}
