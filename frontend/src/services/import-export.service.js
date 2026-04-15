import { api } from "./api";
import { useToastStore } from "../store/toast/toast.store";

function notifySuccess(message) {
  useToastStore.getState().addToast(message, "success");
}

export async function importTransactionsExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/import-export/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  notifySuccess("Nhập dữ liệu giao dịch thành công!");

  return response.data.data;
}

export async function exportTransactionsExcel(params = {}) {
  const response = await api.get("/import-export/export", {
    params,
    responseType: "blob"
  });

  notifySuccess("Xuất dữ liệu giao dịch thành công!");

  return response.data;
}