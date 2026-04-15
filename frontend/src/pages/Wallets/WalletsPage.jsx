import { useEffect, useState } from "react";
import { PageSection } from "../../components/common/PageSection";
import { EmptyState } from "../../components/common/EmptyState";
import {
  createWallet,
  deleteWallet,
  getWallets,
  updateWallet
} from "../../services/wallet.service";
import { formatVND } from "../../utils/formatters";
import { useToast } from "../../store/toast/toast.store";

export function WalletsPage() {
  const toast = useToast();
  const [wallets, setWallets] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", balance: 0 });
  const [error, setError] = useState("");

  async function loadWallets() {
    try {
      const result = await getWallets();
      setWallets(result.data || []);
    } catch (err) {
      const errorMsg = err.message || "Tải danh sách ví thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  useEffect(() => {
    loadWallets();
  }, []);

  function resetForm() {
    setForm({ id: null, name: "", balance: 0 });
  }

  function startEdit(wallet) {
    setForm({
      id: wallet.id,
      name: wallet.name,
      balance: Number(wallet.balance)
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      if (form.id) {
        await updateWallet(form.id, { name: form.name, balance: Number(form.balance) });
        toast.success("Cập nhật ví thành công!");
      } else {
        await createWallet({ name: form.name, balance: Number(form.balance) });
        toast.success("Tạo ví thành công!");
      }
      resetForm();
      await loadWallets();
    } catch (err) {
      const errorMsg = err.message || "Lưu ví thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  async function handleDelete(id) {
    if (deletingIds.includes(id)) {
      return;
    }

    setError("");
    setDeletingIds((prev) => [...prev, id]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 220));
      await deleteWallet(id);
      toast.success("Xóa ví thành công!");
      if (form.id === id) resetForm();
      await loadWallets();
    } catch (err) {
      const errorMsg = err.message || "Xóa ví thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  }

  return (
    <>
      <PageSection title="Ví tiền" subtitle="Tiền mặt, ngân hàng và các tài khoản khác">
        <form className="crud-form" onSubmit={handleSubmit}>
          <input
            placeholder="Tên ví"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Số dư"
            value={form.balance}
            onChange={(event) => setForm((prev) => ({ ...prev, balance: event.target.value }))}
            required
          />
          <button type="submit">{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id ? (
            <button type="button" onClick={resetForm} className="secondary-button">
              Hủy
            </button>
          ) : null}
        </form>
        {error ? <p className="auth-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Danh sách ví" subtitle="Các ví hiện tại của bạn">
        {wallets.length ? (
          <div className="crud-list">
            {wallets.map((wallet) => (
              <article key={wallet.id} className={`crud-item ${deletingIds.includes(wallet.id) ? "is-deleting" : ""}`}>
                <div>
                  <strong>{wallet.name}</strong>
                  <p>{formatVND(wallet.balance)}</p>
                </div>
                <div className="crud-item-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(wallet)}>
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={deletingIds.includes(wallet.id)}
                    onClick={() => handleDelete(wallet.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có ví nào"
            description="Bạn chưa tạo ví tiền để theo dõi số dư."
            hint="Tạo ví đầu tiên bằng biểu mẫu ở phía trên."
          />
        )}
      </PageSection>
    </>
  );
}
