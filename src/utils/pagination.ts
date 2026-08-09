import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  search: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

export function parsePagination(
  req: Request,
  allowedSortColumns: string[],
  defaultSortBy: string
): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
  const search = String(req.query.search || "").trim();
  const rawSortBy = String(req.query.sortBy || defaultSortBy);
  const sortBy = allowedSortColumns.includes(rawSortBy) ? rawSortBy : defaultSortBy;
  const sortOrder = String(req.query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  return { page, limit, offset: (page - 1) * limit, search, sortBy, sortOrder };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
