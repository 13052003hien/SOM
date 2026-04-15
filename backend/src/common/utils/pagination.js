export function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const rawSortBy = String(query.sortBy || "created_at");
  const sortBy = /^[a-zA-Z_]+$/.test(rawSortBy) ? rawSortBy : "created_at";
  const sortOrder = String(query.sortOrder || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const offset = (page - 1) * limit;

  return { page, limit, sortBy, sortOrder, offset };
}

export function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}
