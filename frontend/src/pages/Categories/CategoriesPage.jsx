import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { PageSection } from "../../components/common/PageSection";
import { useToast } from "../../store/toast/toast.store";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "../../services/category.service";

const CATEGORY_GROUP_EXPANDED_STORAGE_KEY = "som.categories.expandedGroups";

function getTypeLabel(type) {
  return type === "income" ? "Thu nhập" : "Chi tiêu";
}

function buildCategoryTree(categories) {
  const typeMap = new Map();

  for (const category of categories) {
    const type = category.type || "expense";
    const groupName = category.group_name || "Khác";

    if (!typeMap.has(type)) {
      typeMap.set(type, new Map());
    }

    const groupMap = typeMap.get(type);
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
    groupMap.get(groupName).push(category);
  }

  return Array.from(typeMap.entries()).map(([type, groupMap]) => ({
    type,
    groups: Array.from(groupMap.entries())
      .map(([groupName, items]) => ({
        groupName,
        items: items.sort((a, b) => a.name.localeCompare(b.name, "vi"))
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName, "vi"))
  }));
}

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", group_name: "", type: "expense" });
  const [groupDrafts, setGroupDrafts] = useState({});
  const [creatingGroupKeys, setCreatingGroupKeys] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [error, setError] = useState("");

  const systemCategories = useMemo(() => categories.filter((category) => category.scope === "system"), [categories]);
  const customCategories = useMemo(() => categories.filter((category) => category.scope !== "system"), [categories]);
  const systemTree = useMemo(() => buildCategoryTree(systemCategories), [systemCategories]);
  const customTree = useMemo(() => buildCategoryTree(customCategories), [customCategories]);

  const suggestedGroups = useMemo(() => {
    const names = systemCategories
      .map((item) => item.group_name)
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b, "vi"));
    return names;
  }, [systemCategories]);

  async function loadCategories() {
    try {
      const result = await getCategories({ page: 1, limit: 100 });
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CATEGORY_GROUP_EXPANDED_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setExpandedGroups(parsed);
      }
    } catch {
      // Ignore invalid localStorage payload.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_GROUP_EXPANDED_STORAGE_KEY, JSON.stringify(expandedGroups));
    } catch {
      // Ignore storage write errors.
    }
  }, [expandedGroups]);

  function getGroupKey(scope, type, groupName) {
    return `${scope}:${type}:${groupName}`;
  }

  function isGroupExpanded(scope, type, groupName) {
    const key = getGroupKey(scope, type, groupName);
    return expandedGroups[key] ?? true;
  }

  function toggleGroup(scope, type, groupName) {
    const key = getGroupKey(scope, type, groupName);
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true)
    }));
  }

  async function handleQuickAdd({ type, groupName, scope }) {
    const key = getGroupKey(scope, type, groupName);
    const rawName = String(groupDrafts[key] || "").trim();

    if (!rawName) {
      toast.warning("Vui lòng nhập tên danh mục con.");
      return;
    }

    if (creatingGroupKeys.includes(key)) return;

    setCreatingGroupKeys((prev) => [...prev, key]);
    try {
      await createCategory({
        name: rawName,
        type,
        group_name: groupName
      });
      toast.success(`Đã thêm "${rawName}" vào nhóm ${groupName}.`);
      setGroupDrafts((prev) => ({ ...prev, [key]: "" }));
      await loadCategories();
    } catch (err) {
      const errorMsg = err.message || "Thêm nhanh danh mục thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreatingGroupKeys((prev) => prev.filter((item) => item !== key));
    }
  }

  function handleQuickAddInputKeyDown(event, payload) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleQuickAdd(payload);
  }

  function resetForm() {
    setForm({ id: null, name: "", group_name: "", type: "expense" });
  }

  function startEdit(category) {
    setForm({ id: category.id, name: category.name, group_name: category.group_name || "", type: category.type });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      if (form.id) {
        await updateCategory(form.id, { name: form.name, type: form.type, group_name: form.group_name || undefined });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await createCategory({ name: form.name, type: form.type, group_name: form.group_name || undefined });
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
          <input
            placeholder="Nhóm (vd: Ăn uống, Lương...)"
            value={form.group_name}
            list="category-group-suggestions"
            onChange={(event) => setForm((prev) => ({ ...prev, group_name: event.target.value }))}
          />
          <datalist id="category-group-suggestions">
            {suggestedGroups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
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

      <PageSection title="Danh mục mặc định" subtitle="Dạng cây: Loại → Nhóm → Danh mục con">
        {systemTree.length ? (
          <div className="category-tree-root">
            {systemTree.map((typeNode) => (
              <section key={typeNode.type} className="category-tree-type-section">
                <header className="category-tree-type-head">
                  <h3>{getTypeLabel(typeNode.type)}</h3>
                  <span className={`type-badge ${typeNode.type === "income" ? "type-badge-income" : "type-badge-expense"}`}>
                    {typeNode.groups.length} nhóm
                  </span>
                </header>

                <div className="category-tree-group-grid">
                  {typeNode.groups.map((groupNode) => (
                    <article key={`${typeNode.type}-${groupNode.groupName}`} className="category-group-card">
                      <header className="category-group-head">
                        <div>
                          <strong>{groupNode.groupName}</strong>
                          <p>{groupNode.items.length} danh mục con</p>
                        </div>

                        <div className="category-group-head-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => toggleGroup("system", typeNode.type, groupNode.groupName)}
                          >
                            {isGroupExpanded("system", typeNode.type, groupNode.groupName) ? "Thu gọn" : "Mở rộng"}
                          </button>
                        </div>
                      </header>

                      {isGroupExpanded("system", typeNode.type, groupNode.groupName) ? (
                        <>
                          <div className="category-chip-list">
                            {groupNode.items.map((item) => (
                              <span key={item.id} className="category-chip">
                                {item.name}
                              </span>
                            ))}
                          </div>

                          <div className="category-quick-add-row">
                            <input
                              placeholder="Tên mục con mới"
                              value={groupDrafts[getGroupKey("system", typeNode.type, groupNode.groupName)] || ""}
                              onChange={(event) => setGroupDrafts((prev) => ({
                                ...prev,
                                [getGroupKey("system", typeNode.type, groupNode.groupName)]: event.target.value
                              }))}
                              onKeyDown={(event) =>
                                handleQuickAddInputKeyDown(event, {
                                  type: typeNode.type,
                                  groupName: groupNode.groupName,
                                  scope: "system"
                                })
                              }
                            />
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={creatingGroupKeys.includes(getGroupKey("system", typeNode.type, groupNode.groupName))}
                              onClick={() => handleQuickAdd({ type: typeNode.type, groupName: groupNode.groupName, scope: "system" })}
                            >
                              Thêm nhanh vào nhóm này
                            </button>
                          </div>
                        </>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có danh mục mặc định"
            description="Hệ thống chưa khởi tạo được bộ danh mục chuẩn."
            hint="Vui lòng kiểm tra lại backend bootstrap hoặc schema categories."
          />
        )}
      </PageSection>

      <PageSection title="Danh mục riêng" subtitle="Danh mục cá nhân theo dạng cây giống bộ mặc định">
        {customTree.length ? (
          <div className="category-tree-root">
            {customTree.map((typeNode) => (
              <section key={`custom-${typeNode.type}`} className="category-tree-type-section">
                <header className="category-tree-type-head">
                  <h3>{getTypeLabel(typeNode.type)}</h3>
                  <span className={`type-badge ${typeNode.type === "income" ? "type-badge-income" : "type-badge-expense"}`}>
                    {typeNode.groups.reduce((sum, group) => sum + group.items.length, 0)} mục
                  </span>
                </header>

                <div className="category-tree-group-grid">
                  {typeNode.groups.map((groupNode) => (
                    <article key={`custom-${typeNode.type}-${groupNode.groupName}`} className="category-group-card">
                      <header className="category-group-head">
                        <div>
                          <strong>{groupNode.groupName}</strong>
                          <p>{groupNode.items.length} danh mục con</p>
                        </div>

                        <div className="category-group-head-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => toggleGroup("custom", typeNode.type, groupNode.groupName)}
                          >
                            {isGroupExpanded("custom", typeNode.type, groupNode.groupName) ? "Thu gọn" : "Mở rộng"}
                          </button>
                        </div>
                      </header>

                      {isGroupExpanded("custom", typeNode.type, groupNode.groupName) ? (
                        <>
                          <div className="category-custom-item-list">
                            {groupNode.items.map((category) => (
                              <div key={category.id} className={`crud-item ${deletingIds.includes(category.id) ? "is-deleting" : ""}`}>
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
                              </div>
                            ))}
                          </div>

                          <div className="category-quick-add-row">
                            <input
                              placeholder="Tên mục con mới"
                              value={groupDrafts[getGroupKey("custom", typeNode.type, groupNode.groupName)] || ""}
                              onChange={(event) => setGroupDrafts((prev) => ({
                                ...prev,
                                [getGroupKey("custom", typeNode.type, groupNode.groupName)]: event.target.value
                              }))}
                              onKeyDown={(event) =>
                                handleQuickAddInputKeyDown(event, {
                                  type: typeNode.type,
                                  groupName: groupNode.groupName,
                                  scope: "custom"
                                })
                              }
                            />
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={creatingGroupKeys.includes(getGroupKey("custom", typeNode.type, groupNode.groupName))}
                              onClick={() => handleQuickAdd({ type: typeNode.type, groupName: groupNode.groupName, scope: "custom" })}
                            >
                              Thêm nhanh vào nhóm này
                            </button>
                          </div>
                        </>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có danh mục riêng"
            description="Danh mục mặc định đã có sẵn, còn danh mục riêng sẽ do bạn tự thêm."
            hint="Hãy thêm danh mục riêng nếu bạn muốn phân loại theo nhu cầu cá nhân."
          />
        )}
      </PageSection>
    </>
  );
}
