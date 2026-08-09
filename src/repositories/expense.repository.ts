import { pool } from "../config/database";
import { PaginationParams } from "../utils/pagination";

export interface CreateExpenseInput {
  orgId: number;
  amount: number;
  expenseDate: string;
  reason: string;
  createdBy: number;
}

export const expenseRepository = {
  async create(data: CreateExpenseInput) {
    const { rows } = await pool.query(
      `INSERT INTO expenses (org_id, amount, expense_date, reason, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$5) RETURNING *`,
      [data.orgId, data.amount, data.expenseDate, data.reason, data.createdBy]
    );
    return rows[0];
  },

  async findByIdAndOrg(expenseId: number, orgId: number) {
    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE expense_id = $1 AND org_id = $2`,
      [expenseId, orgId]
    );
    return rows[0] ?? null;
  },

  async listByOrg(orgId: number, pagination: PaginationParams, from?: string, to?: string) {
    const { limit, offset, search, sortBy, sortOrder } = pagination;
    const params: unknown[] = [orgId];
    const where: string[] = ["e.org_id = $1"];

    if (search) {
      params.push(`%${search}%`);
      where.push(`e.reason ILIKE $${params.length}`);
    }
    if (from) { params.push(from); where.push(`e.expense_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`e.expense_date <= $${params.length}`); }
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM expenses e ${whereSql}`,
      params
    );
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(
      `SELECT e.*, c.first_name AS created_by_first_name, c.last_name AS created_by_last_name
       FROM expenses e LEFT JOIN users c ON c.user_id = e.created_by
       ${whereSql}
       ORDER BY e.${sortBy} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows, total: countResult.rows[0].count as number };
  },

  async update(expenseId: number, orgId: number, data: Partial<{ amount: number; expenseDate: string; reason: string }>, updatedBy: number) {
    const map: Record<string, string> = { amount: "amount", expenseDate: "expense_date", reason: "reason" };
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${map[key]} = $${params.length}`);
    });
    params.push(updatedBy);
    fields.push(`updated_by = $${params.length}`);
    params.push(expenseId, orgId);
    const { rows } = await pool.query(
      `UPDATE expenses SET ${fields.join(", ")}, updated_at = now()
       WHERE expense_id = $${params.length - 1} AND org_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },

  async remove(expenseId: number, orgId: number) {
    await pool.query(`DELETE FROM expenses WHERE expense_id = $1 AND org_id = $2`, [expenseId, orgId]);
  },

  async sumForOrg(orgId: number | null, from?: string, to?: string) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`expense_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`expense_date <= $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS total FROM expenses ${whereClause}`,
      params
    );
    return Number(rows[0].total);
  },

  async monthlyTotalsForOrg(orgId: number | null, from?: string, to?: string) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`expense_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`expense_date <= $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', expense_date), 'YYYY-MM') AS month, COALESCE(SUM(amount),0)::numeric AS total
       FROM expenses ${whereClause}
       GROUP BY 1 ORDER BY 1`,
      params
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  },
};
