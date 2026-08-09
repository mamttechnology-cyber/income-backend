import { pool } from "../config/database";
import { PaginationParams } from "../utils/pagination";

export const organizationRepository = {
  async create(data: { orgCode: string; name: string; email?: string; mobile?: string; address?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO organizations (org_code, name, email, mobile, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.orgCode, data.name, data.email ?? null, data.mobile ?? null, data.address ?? null]
    );
    return rows[0];
  },

  async findById(orgId: number) {
    const { rows } = await pool.query(`SELECT * FROM organizations WHERE org_id = $1`, [orgId]);
    return rows[0] ?? null;
  },

  async list(pagination: PaginationParams) {
    const { limit, offset, search, sortBy, sortOrder } = pagination;
    const params: unknown[] = [];
    let where = "";
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE name ILIKE $${params.length} OR org_code ILIKE $${params.length}`;
    }
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM organizations ${where}`,
      params
    );
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(
      `SELECT * FROM organizations ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows, total: countResult.rows[0].count as number };
  },

  async update(orgId: number, data: Partial<{ name: string; email: string; mobile: string; address: string; status: string }>) {
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${key} = $${params.length}`);
    });
    if (fields.length === 0) return this.findById(orgId);
    params.push(orgId);
    const { rows } = await pool.query(
      `UPDATE organizations SET ${fields.join(", ")}, updated_at = now()
       WHERE org_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },

  async remove(orgId: number) {
    await pool.query(`UPDATE organizations SET status = 'INACTIVE', updated_at = now() WHERE org_id = $1`, [orgId]);
  },

  async countUsers(orgId: number | null) {
    const params: unknown[] = [];
    const where: string[] = [];
    if (orgId !== null) { params.push(orgId); where.push(`org_id = $${params.length}`); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM users ${whereClause}`, params);
    return rows[0].count as number;
  },
};
