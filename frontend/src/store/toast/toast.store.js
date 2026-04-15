import { create } from "zustand";

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = "success", duration = 3000) => {
    const id = toastId++;
    const toast = { id, message, type };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Helpers cho các loại notification
export const useToast = () => {
  const { addToast } = useToastStore();

  return {
    success: (message, duration = 3000) => addToast(message, "success", duration),
    error: (message, duration = 5000) => addToast(message, "error", duration),
    info: (message, duration = 3000) => addToast(message, "info", duration),
    warning: (message, duration = 4000) => addToast(message, "warning", duration),
  };
};
