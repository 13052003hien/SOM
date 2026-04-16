import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

function getCategoryLabel(category) {
  if (!category) return "";
  return category.group_name ? `${category.group_name} / ${category.name}` : category.name;
}

function formatDisplayDate(value) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  if (!year || !month || !day) return String(value || "");
  return `${day}/${month}/${year}`;
}

export function TransactionsPage() {
  const MODAL_ANIMATION_MS = 220;
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransactionModalClosing, setIsTransactionModalClosing] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [initialModalForm, setInitialModalForm] = useState(null);
  const [error, setError] = useState("");
  const modalCloseTimerRef = useRef(null);
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get("q") || "",
    type: searchParams.get("type") || "",
    category_id: searchParams.get("category_id") || "",
    date_from: searchParams.get("date_from") || "",
    date_to: searchParams.get("date_to") || "",
    amount_min: searchParams.get("amount_min") || "",
    amount_max: searchParams.get("amount_max") || ""
  }));
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page") || 1);
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [form, setForm] = useState({
    id: null,
    wallet_id: "",
    category_id: "",
    amount: "",
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
    note: ""
  });

  function snapshotForm(payload) {
    return {
      wallet_id: String(payload.wallet_id || ""),
      category_id: String(payload.category_id || ""),
      amount: String(payload.amount || ""),
      type: payload.type || "expense",
      date: String(payload.date || ""),
      note: String(payload.note || "")
    };
  }

  function resetForm() {
    setForm((prev) => ({
      id: null,
      wallet_id: prev.wallet_id,
      category_id: (() => {
        const nextType = prev.type || "expense";
        const nextTypeCategory = categories.find((category) => category.type === nextType);
        return nextTypeCategory?.id ? String(nextTypeCategory.id) : "";
      })(),
      amount: "",
      type: prev.type || "expense",
      date: new Date().toISOString().slice(0, 10),
      note: ""
    }));
  }

  function openCreateModal() {
    setError("");
    setIsCloseConfirmOpen(false);
    setForm((prev) => {
      const nextType = prev.type || "expense";
      const nextTypeCategory = categories.find((category) => category.type === nextType);
      const nextForm = {
        id: null,
        wallet_id: prev.wallet_id || (wallets[0]?.id ? String(wallets[0].id) : ""),
        category_id: nextTypeCategory?.id ? String(nextTypeCategory.id) : "",
        amount: "",
        type: nextType,
        date: new Date().toISOString().slice(0, 10),
        note: ""
      };
      setInitialModalForm(snapshotForm(nextForm));
      return nextForm;
    });
    setIsTransactionModalClosing(false);
    setIsTransactionModalOpen(true);
  }

  function closeTransactionModal() {
    if (modalCloseTimerRef.current) {
      clearTimeout(modalCloseTimerRef.current);
      modalCloseTimerRef.current = null;
    }
    setIsTransactionModalOpen(false);
    setIsTransactionModalClosing(false);
    setIsCloseConfirmOpen(false);
    setInitialModalForm(null);
    setError("");
  }

  const isModalDirty = useMemo(() => {
    if (!isTransactionModalOpen || !initialModalForm) return false;
    const current = snapshotForm(form);
    return JSON.stringify(current) !== JSON.stringify(initialModalForm);
  }, [form, initialModalForm, isTransactionModalOpen]);

  function requestCloseTransactionModal({ force = false } = {}) {
    if (!force && isModalDirty) {
      setIsCloseConfirmOpen(true);
      return;
    }

    if (isTransactionModalClosing) return;

    setIsTransactionModalClosing(true);
    if (modalCloseTimerRef.current) {
      clearTimeout(modalCloseTimerRef.current);
    }
    modalCloseTimerRef.current = window.setTimeout(() => {
      closeTransactionModal();
    }, MODAL_ANIMATION_MS);
  }

  function cancelCloseConfirm() {
    setIsCloseConfirmOpen(false);
  }

  function confirmCloseWithoutSaving() {
    setIsCloseConfirmOpen(false);
    requestCloseTransactionModal({ force: true });
  }

  async function loadData() {
    try {
      const [transactionsResult, walletsResult, categoriesResult] = await Promise.all([
        getTransactions({
          page,
          limit: 20,
          q: filters.q || undefined,
          type: filters.type || undefined,
          category_id: filters.category_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          amount_min: filters.amount_min || undefined,
          amount_max: filters.amount_max || undefined
        }),
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
        category_id: (() => {
          const selectedCategory = nextCategories.find((category) => String(category.id) === String(prev.category_id));
          if (selectedCategory && selectedCategory.type === prev.type) {
            return prev.category_id;
          }

          const nextType = prev.type || "expense";
          const nextTypeCategory = nextCategories.find((category) => category.type === nextType);
          return nextTypeCategory?.id ? String(nextTypeCategory.id) : "";
        })()
      }));
    } catch (err) {
      const errorMsg = err.message || "Tải giao dịch thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  useEffect(() => {
    loadData();
  }, [
    page,
    filters.q,
    filters.type,
    filters.category_id,
    filters.date_from,
    filters.date_to,
    filters.amount_min,
    filters.amount_max
  ]);

  useEffect(() => {
    const nextParams = {};

    if (filters.q) nextParams.q = filters.q;
    if (filters.type) nextParams.type = filters.type;
    if (filters.category_id) nextParams.category_id = filters.category_id;
    if (filters.date_from) nextParams.date_from = filters.date_from;
    if (filters.date_to) nextParams.date_to = filters.date_to;
    if (filters.amount_min) nextParams.amount_min = filters.amount_min;
    if (filters.amount_max) nextParams.amount_max = filters.amount_max;
    if (page > 1) nextParams.page = String(page);

    setSearchParams(nextParams, { replace: true });
  }, [
    setSearchParams,
    page,
    filters.q,
    filters.type,
    filters.category_id,
    filters.date_from,
    filters.date_to,
    filters.amount_min,
    filters.amount_max
  ]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && isCloseConfirmOpen) {
        cancelCloseConfirm();
        return;
      }

      if (event.key === "Escape" && isTransactionModalOpen) {
        requestCloseTransactionModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTransactionModalOpen, isCloseConfirmOpen]);

  useEffect(() => {
    return () => {
      if (modalCloseTimerRef.current) {
        clearTimeout(modalCloseTimerRef.current);
      }
    };
  }, []);

  const walletNameById = useMemo(() => {
    return new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  }, [wallets]);

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, getCategoryLabel(category)]));
  }, [categories]);

  const availableCategories = useMemo(() => {
    return categories.filter((category) => category.type === form.type);
  }, [categories, form.type]);

  const filterCategories = useMemo(() => {
    if (!filters.type) return categories;
    return categories.filter((category) => category.type === filters.type);
  }, [categories, filters.type]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    setPage(1);
  }

  function handleResetFilters() {
    setFilters({
      q: "",
      type: "",
      category_id: "",
      date_from: "",
      date_to: "",
      amount_min: "",
      amount_max: ""
    });
    setPage(1);
  }

  function startEdit(row) {
    setError("");
    setIsCloseConfirmOpen(false);
    const nextForm = {
      id: row.id,
      wallet_id: String(row.wallet_id),
      category_id: String(row.category_id),
      amount: String(row.amount),
      type: row.type,
      date: String(row.date).slice(0, 10),
      note: row.note || ""
    };
    setForm(nextForm);
    setInitialModalForm(snapshotForm(nextForm));
    setIsTransactionModalClosing(false);
    setIsTransactionModalOpen(true);
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
      requestCloseTransactionModal({ force: true });
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
        <div className="transaction-toolbar">
          <p className="page-note">Dùng popup để tạo hoặc chỉnh sửa giao dịch, giúp màn danh sách luôn gọn và dễ tra cứu.</p>
          <button type="button" className="primary-button" onClick={openCreateModal}>Thêm giao dịch</button>
        </div>
      </PageSection>

      <PageSection title="Danh sách giao dịch" subtitle="Danh sách giao dịch có phân trang">
        <form className="transaction-filter-panel" onSubmit={handleFilterSubmit}>
          <div className="transaction-filter-row transaction-filter-row-primary">
            <input
              placeholder="Tìm theo ghi chú, ví, danh mục..."
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
            />

            <select
              value={filters.type}
              onChange={(event) => {
                const nextType = event.target.value;
                setFilters((prev) => ({ ...prev, type: nextType, category_id: "" }));
                setPage(1);
              }}
            >
              <option value="">Tất cả loại</option>
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>

            <select
              value={filters.category_id}
              onChange={(event) => updateFilter("category_id", event.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {filterCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryLabel(category)} ({getTypeLabel(category.type)})
                </option>
              ))}
            </select>

            <div className="transaction-filter-actions">
              <button type="submit">Tra cứu</button>
              <button type="button" className="secondary-button" onClick={handleResetFilters}>Xóa lọc</button>
            </div>
          </div>

          <div className="transaction-filter-row transaction-filter-row-secondary">
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) => updateFilter("date_from", event.target.value)}
            />

            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => updateFilter("date_to", event.target.value)}
            />

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Số tiền từ"
              value={filters.amount_min}
              onChange={(event) => updateFilter("amount_min", event.target.value)}
            />

            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Số tiền đến"
              value={filters.amount_max}
              onChange={(event) => updateFilter("amount_max", event.target.value)}
            />
          </div>
        </form>

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
        {meta ? (
          <div className="table-pagination">
            <p className="table-meta">Trang {meta.page} / {meta.totalPages}</p>
            <div className="crud-item-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={meta.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trang trước
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Trang sau
              </button>
            </div>
          </div>
        ) : null}
      </PageSection>

      {isTransactionModalOpen ? (
        <div
          className={`transaction-modal-overlay ${isTransactionModalClosing ? "is-closing" : "is-opening"}`}
          role="dialog"
          aria-modal="true"
          onClick={() => requestCloseTransactionModal()}
        >
          <div className="transaction-modal" onClick={(event) => event.stopPropagation()}>
            <div className="transaction-modal-head">
              <div>
                <h3>{form.id ? "Sửa giao dịch" : "Tạo giao dịch mới"}</h3>
                <p>{form.id ? "Cập nhật thông tin giao dịch đã chọn" : "Nhập thông tin để tạo giao dịch"}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => requestCloseTransactionModal()}>Đóng</button>
            </div>

            <form className="crud-form transaction-modal-form" onSubmit={handleSubmit}>
              <select
                value={form.wallet_id}
                onChange={(event) => setForm((prev) => ({ ...prev, wallet_id: event.target.value }))}
                required
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                ))}
              </select>

              <select
                value={form.category_id}
                onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                required
              >
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryLabel(category)} ({getTypeLabel(category.type)})
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
                onChange={(event) => {
                  const nextType = event.target.value;
                  const nextCategories = categories.filter((category) => category.type === nextType);
                  setForm((prev) => ({
                    ...prev,
                    type: nextType,
                    category_id: nextCategories.some((category) => String(category.id) === String(prev.category_id))
                      ? prev.category_id
                      : (nextCategories[0]?.id ? String(nextCategories[0].id) : "")
                  }));
                }}
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

              <div className="transaction-modal-actions">
                <button type="submit">{form.id ? "Cập nhật" : "Tạo mới"}</button>
                <button type="button" className="secondary-button" onClick={() => requestCloseTransactionModal()}>Hủy</button>
              </div>
            </form>

            {error ? <p className="auth-error">{error}</p> : null}
          </div>
        </div>
      ) : null}

      {isCloseConfirmOpen ? (
        <div className="transaction-confirm-overlay" role="dialog" aria-modal="true" onClick={cancelCloseConfirm}>
          <div className="transaction-confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <h4>Đóng popup mà không lưu?</h4>
            <p>Các thay đổi bạn vừa nhập sẽ bị mất. Bạn muốn tiếp tục không?</p>
            <div className="transaction-confirm-actions">
              <button type="button" className="secondary-button" onClick={cancelCloseConfirm}>Tiếp tục chỉnh sửa</button>
              <button type="button" className="danger-button" onClick={confirmCloseWithoutSaving}>Đóng không lưu</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
