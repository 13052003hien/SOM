import { useEffect, useState } from "react";
import { uiStore } from "../../store/ui/ui.store";

export function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(uiStore.getTheme());

  useEffect(() => {
    return uiStore.subscribe(setTheme);
  }, []);

  const isLight = theme === "light";
  const nextThemeLabel = isLight ? "tối" : "sáng";

  return (
    <button
      type="button"
      className={`theme-toggle ${isLight ? "is-light" : "is-dark"} ${className}`.trim()}
      onClick={() => uiStore.toggleTheme()}
      aria-label={`Đang ở giao diện ${isLight ? "sáng" : "tối"}. Bấm để chuyển sang giao diện ${nextThemeLabel}.`}
      title={`Chuyển sang giao diện ${nextThemeLabel}`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-icon theme-toggle-icon-sun">
          <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
          </svg>
        </span>

        <span className="theme-toggle-icon theme-toggle-icon-moon">
          <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3c0.33 0 0.66 0.02 0.99 0.08A7 7 0 0 0 21 12.79z" />
          </svg>
        </span>

        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
