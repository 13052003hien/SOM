const THEME_KEY = "som_theme";
const SUPPORTED_THEMES = ["dark", "light"];
const listeners = new Set();

function normalizeTheme(theme) {
  return SUPPORTED_THEMES.includes(theme) ? theme : "dark";
}

function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export const uiStore = {
  theme: "dark",

  initializeTheme() {
    if (typeof window === "undefined") return this.theme;

    const storedTheme = normalizeTheme(window.localStorage.getItem(THEME_KEY));
    this.theme = storedTheme;
    applyThemeToDocument(this.theme);
    return this.theme;
  },

  getTheme() {
    if (typeof window !== "undefined") {
      return this.initializeTheme();
    }
    return this.theme;
  },

  setTheme(theme) {
    this.theme = normalizeTheme(theme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, this.theme);
    }

    applyThemeToDocument(this.theme);
    listeners.forEach((listener) => listener(this.theme));
  },

  toggleTheme() {
    const nextTheme = this.getTheme() === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
