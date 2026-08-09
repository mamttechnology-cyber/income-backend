import { pool } from "../config/database";
import { PaginationParams } from "../utils/pagination";

export interface CreateIncomeInput {
  orgId: number;
  paidByUserId: number;
  amount: number;
  incomeDate: string;
  description?: string;
  createdBy: number;
}

export const incomeRepository = {
  async create(data: CreateIncomeInput) {
    const { rows } = await pool.query(
      `INSERT INTO incomes (org_id, paid_by_user_id, amount, income_date, description, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *`,
      [data.orgId, data.paidByUserId, data.amount, data.incomeDate, data.description ?? null, data.createdBy]
    );
    return rows[0];
  },

  async findByIdAndOrg(incomeId: number, orgId: number) {
    const { rows } = await pool.query(
      `SELECT i.*, u.first_name AS paid_by_first_name, u.last_name AS paid_by_last_name
       FROM incomes i JOIN users u ON u.user_id = i.paid_by_user_id
       WHERE i.income_id = $1 AND i.org_id = $2`,
      [incomeId, orgId]
    );
    return rows[0] ?? null;
  },

  async listByOrg(orgId: number, pagination: PaginationParams, from?: string, to?: string) {
    const { limit, offset, search, sortBy, sortOrder } = pagination;
    const params: unknown[] = [orgId];
    const where: string[] = ["i.org_id = $1"];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(i.description ILIKE $${params.length} OR u.first_name ILIKE $${params.length})`);
    }
    if (from) {
      params.push(from);
      where.push(`i.income_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      where.push(`i.income_date <= $${params.length}`);
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM incomes i JOIN users u ON u.user_id = i.paid_by_user_id ${whereSql}`,
      params
    );
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(
      `SELECT i.*, u.first_name AS paid_by_first_name, u.last_name AS paid_by_last_name,
              c.first_name AS created_by_first_name, c.last_name AS created_by_last_name
       FROM incomes i
       JOIN users u ON u.user_id = i.paid_by_user_id
       LEFT JOIN users c ON c.user_id = i.created_by
       ${whereSql}
       ORDER BY i.${sortBy} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows, total: countResult.rows[0].count as number };
  },

  async update(incomeId: number, orgId: number, data: Partial<{ paidByUserId: number; amount: number; incomeDate: string; description: string }>, updatedBy: number) {
    const map: Record<string, string> = {
      paidByUserId: "paid_by_user_id",
      amount: "amount",
      incomeDate: "income_date",
      description: "description",
    };
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${map[key]} = $${params.length}`);
    });
    params.push(updatedBy);
    fields.push(`updated_by = $${params.length}`);
    params.push(incomeId, orgId);
    const { rows } = await pool.query(
      `UPDATE incomes SET ${fields.join(", ")}, updated_at = now()
       WHERE income_id = $${params.length - 1} AND org_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },

  async remove(incomeId: number, orgId: number) {
    await pool.query(`DELETE FROM incomes WHERE income_id = $1 AND org_id = $2`, [incomeId, orgId]);
  },

  async sumForOrg(orgId: number | null, from?: string, to?: string) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`income_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`income_date <= $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS total FROM incomes ${whereClause}`,
      params
    );
    return Number(rows[0].total);
  },

  async sumForUser(orgId: number | null, userId: number, from?: string, to?: string) {
    const params: unknown[] = [userId];
    const where: string[] = ["paid_by_user_id = $1"];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`income_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`income_date <= $${params.length}`); }
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS total FROM incomes WHERE ${where.join(" AND ")}`,
      params
    );
    return Number(rows[0].total);
  },

  async monthlyTotalsForOrg(orgId: number | null, from?: string, to?: string) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`income_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`income_date <= $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT to_char(date_trunc('month', income_date), 'YYYY-MM') AS month, COALESCE(SUM(amount),0)::numeric AS total
       FROM incomes ${whereClause}
       GROUP BY 1 ORDER BY 1`,
      params
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  },
};
