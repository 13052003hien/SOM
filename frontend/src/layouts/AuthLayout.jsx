import { Outlet } from "react-router-dom";
import nightclubVisual from "../assets/nightclub-visual.svg";

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <div className="auth-shell-glow auth-shell-glow-left" aria-hidden="true" />
      <div className="auth-shell-glow auth-shell-glow-right" aria-hidden="true" />
      <section className="auth-sidebar">
        <div className="auth-intro">
          <p className="auth-intro-kicker">SOM NIGHT CLUB MODE</p>
          <h1>Sổ tay chi tiêu với nhịp điệu neon.</h1>
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
            <p className="auth-visual-kicker">WELCOME TO THE PARTY</p>
            <h2>JOIN THE CLUB</h2>
            <p>
              Quản lý tiền bạc trong một không gian tối, tương phản cao, glow mềm và cảm giác như một poster nightclub.
            </p>
          </div>
          <div className="auth-visual-pills">
            <span>Neon</span>
            <span>Focus</span>
            <span>Flow</span>
          </div>
        </div>
      </section>
      <div className="page-section auth-panel">
        <Outlet />
      </div>
    </main>
  );
}
