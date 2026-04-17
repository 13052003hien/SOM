import { useEffect, useState } from "react";
import { uiStore } from "../../store/ui/ui.store";

export function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(uiStore.getTheme());

  useEffect(() => {
    return uiStore.subscribe(setTheme);
  }, []);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={() => uiStore.toggleTheme()}
      aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
      title={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
    >
      <span className={`theme-toggle-dot ${isLight ? "is-light" : "is-dark"}`} aria-hidden="true" />
      <span className="theme-toggle-label">{isLight ? "Giao diện sáng" : "Giao diện tối"}</span>
      <small className="theme-toggle-hint">{isLight ? "Bấm để đổi sang tối" : "Bấm để đổi sang sáng"}</small>
    </button>
  );
}
