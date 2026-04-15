export const authStore = {
  tokenKey: "som_token",
  userKey: "som_user",

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  getUser() {
    const rawUser = localStorage.getItem(this.userKey);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      return null;
    }
  },

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  },

  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user || null));
  },

  setSession({ accessToken, user }) {
    this.setToken(accessToken);
    this.setUser(user);
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  },

  clearToken() {
    this.clearSession();
  }
};
