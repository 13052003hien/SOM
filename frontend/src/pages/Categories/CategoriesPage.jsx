import { useEffect, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { PageSection } from "../../components/common/PageSection";
import { useToast } from "../../store/toast/toast.store";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "../../services/category.service";

function getTypeLabel(type) {
  return type === "income" ? "Thu nhập" : "Chi tiêu";
}

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", type: "expense" });
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      const result = await getCategories();
      setCategories(result.data || []);
    } catch (err) {
      const errorMsg = err.message || "Tải danh mục thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setForm({ id: null, name: "", type: "expense" });
  }

  function startEdit(category) {
    setForm({ id: category.id, name: category.name, type: category.type });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      if (form.id) {
        await updateCategory(form.id, { name: form.name, type: form.type });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory({ name: form.name, type: form.type });
        toast.success("Tạo danh mục thành công!");
      }
      resetForm();
      await loadCategories();
    } catch (err) {
      const errorMsg = err.message || "Lưu danh mục thất bại";
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
      await deleteCategory(id);
      if (form.id === id) resetForm();
      toast.success("Xóa danh mục thành công!");
      await loadCategories();
    } catch (err) {
      const errorMsg = err.message || "Xóa danh mục thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDeletingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  }

  return (
    <>
      <PageSection title="Danh mục" subtitle="Phân loại thu nhập và chi tiêu">
        <form className="crud-form" onSubmit={handleSubmit}>
          <input
            placeholder="Tên danh mục"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
          </select>
          <button type="submit">{form.id ? "Cập nhật" : "Tạo mới"}</button>
          {form.id ? (
            <button type="button" onClick={resetForm} className="secondary-button">
              Hủy
            </button>
          ) : null}
        </form>
        {error ? <p className="auth-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Danh sách danh mục" subtitle="Danh mục hiện tại của bạn">
        {categories.length ? (
          <div className="crud-list">
            {categories.map((category) => (
              <article key={category.id} className={`crud-item ${deletingIds.includes(category.id) ? "is-deleting" : ""}`}>
                <div>
                  <strong>{category.name}</strong>
                  <p>{getTypeLabel(category.type)}</p>
                </div>
                <div className="crud-item-actions">
                  <button type="button" className="secondary-button" onClick={() => startEdit(category)}>
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={deletingIds.includes(category.id)}
                    onClick={() => handleDelete(category.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có danh mục"
            description="Danh mục thu nhập và chi tiêu chưa được thiết lập."
            hint="Hãy thêm danh mục để bắt đầu phân loại giao dịch."
          />
        )}
      </PageSection>
    </>
  );
}
