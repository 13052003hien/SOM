export const transactionStore = {
  cache: [],
  set(items) {
    this.cache = Array.isArray(items) ? items : [];
  },
  get() {
    return this.cache;
  }
};
