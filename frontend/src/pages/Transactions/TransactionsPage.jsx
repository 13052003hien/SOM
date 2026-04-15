import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { PageSection } from "../../components/common/PageSection";
import { getCategories } from "../../services/category.service";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction
} from "../../services/transaction.service";
import { getWallets } from "../../services/wallet.service";
import { useToast } from "../../store/toast/toast.store";
import { formatVND } from "../../utils/formatters";

function getTypeLabel(type) {
  return type === "income" ? "Thu nhập" : "Chi tiêu";
}

function formatDisplayDate(value) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  if (!year || !month || !day) return String(value || "");
  return `${day}/${month}/${year}`;
}

export function TransactionsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: null,
    wallet_id: "",
    category_id: "",
    amount: "",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
    note: ""
  });

  function resetForm() {
    setForm((prev) => ({
      ...prev,
      id: null,
      amount: "",
      note: ""
    }));
  }

  async function loadData() {
    try {
      const [transactionsResult, walletsResult, categoriesResult] = await Promise.all([
        getTransactions({ page: 1, limit: 20 }),
        getWallets({ page: 1, limit: 100 }),
        getCategories({ page: 1, limit: 100 })
      ]);

      const nextWallets = walletsResult.data || [];
      const nextCategories = categoriesResult.data || [];

      setRows(transactionsResult.data || []);
      setMeta(transactionsResult.meta || null);
      setWallets(nextWallets);
      setCategories(nextCategories);

      setForm((prev) => ({
        ...prev,
        wallet_id: prev.wallet_id || (nextWallets[0]?.id ? String(nextWallets[0].id) : ""),
        category_id: prev.category_id || (nextCategories[0]?.id ? String(nextCategories[0].id) : "")
      }));
    } catch (err) {
      const errorMsg = err.message || "Tải giao dịch thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const walletNameById = useMemo(() => {
    return new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  }, [wallets]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  function startEdit(row) {
    setForm({
      id: row.id,
      wallet_id: String(row.wallet_id),
      category_id: String(row.category_id),
      amount: String(row.amount),
      type: row.type,
      date: String(row.date).slice(0, 10),
      note: row.note || ""
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      wallet_id: Number(form.wallet_id),
      category_id: Number(form.category_id),
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
      note: form.note
    };

    try {
      if (form.id) {
        await updateTransaction(form.id, payload);
        toast.success("Cập nhật giao dịch thành công!");
      } else {
        await createTransaction(payload);
        toast.success("Tạo giao dịch thành công!");
      }
      resetForm();
      await loadData();
    } catch (err) {
      const errorMsg = err.message || "Lưu giao dịch thất bại";
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
      await deleteTransaction(id);
      if (form.id === id) resetForm();
      toast.success("Xóa giao dịch thành công!");
      await loadData();
    } catch (err) {
      const errorMsg = err.message || "Xóa giao dịch thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  }

  return (
    <>
      <PageSection title="Giao dịch" subtitle="Tạo, sửa, xóa giao dịch">
        <form className="crud-form" onSubmit={handleSubmit}>
          <select
            value={form.wallet_id}
            onChange={(event) => setForm((prev) => ({ ...prev, wallet_id: event.target.value }))}
            required
          >
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>

          <select
            value={form.category_id}
            onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({getTypeLabel(category.type)})
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Số tiền"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />

          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
          </select>

          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />

          <input
            placeholder="Ghi chú"
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
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

      <PageSection title="Danh sách giao dịch" subtitle="Danh sách giao dịch có phân trang">
        {rows.length ? (
          <div className="transaction-list-wrap">
            <div className="table-wrap desktop-transaction-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ví</th>
                    <th>Danh mục</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={deletingIds.includes(row.id) ? "row-deleting" : ""}>
                      <td>{row.id}</td>
                      <td>{walletNameById.get(row.wallet_id) || `#${row.wallet_id}`}</td>
                      <td>{categoryNameById.get(row.category_id) || `#${row.category_id}`}</td>
                      <td>
                        <span className={`type-badge ${row.type === "income" ? "type-badge-income" : "type-badge-expense"}`}>
                          {getTypeLabel(row.type)}
                        </span>
                      </td>
                      <td>{formatVND(row.amount)}</td>
                      <td>{String(row.date).slice(0, 10)}</td>
                      <td>{row.note}</td>
                      <td>
                        <div className="crud-item-actions">
                          <button type="button" className="secondary-button" onClick={() => startEdit(row)}>
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="danger-button"
                            disabled={deletingIds.includes(row.id)}
                            onClick={() => handleDelete(row.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-transaction-list">
              {rows.map((row) => (
                <article key={row.id} className={`mobile-transaction-card ${deletingIds.includes(row.id) ? "row-deleting" : ""}`}>
                  <header>
                    <strong>#{row.id}</strong>
                    <span className={`type-badge ${row.type === "income" ? "type-badge-income" : "type-badge-expense"}`}>
                      {getTypeLabel(row.type)}
                    </span>
                  </header>

                  <div className="mobile-transaction-meta">
                    <p><span>Ví</span><strong>{walletNameById.get(row.wallet_id) || `#${row.wallet_id}`}</strong></p>
                    <p><span>Danh mục</span><strong>{categoryNameById.get(row.category_id) || `#${row.category_id}`}</strong></p>
                    <p><span>Ngày</span><strong>{formatDisplayDate(row.date)}</strong></p>
                    <p><span>Số tiền</span><strong>{formatVND(row.amount)}</strong></p>
                  </div>

                  {row.note ? <p className="mobile-transaction-note">{row.note}</p> : null}

                  <div className="crud-item-actions">
                    <button type="button" className="secondary-button" onClick={() => startEdit(row)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      disabled={deletingIds.includes(row.id)}
                      onClick={() => handleDelete(row.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa có giao dịch"
            description="Danh sách giao dịch đang trống ở thời điểm hiện tại."
            hint="Hãy tạo giao dịch mới bằng biểu mẫu ở bên trên."
          />
        )}
        {meta ? <p className="table-meta">Trang {meta.page} / {meta.totalPages}</p> : null}
      </PageSection>
    </>
  );
}
