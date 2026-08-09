import { pool } from "../config/database";
import { PaginationParams } from "../utils/pagination";

export interface CreateUserInput {
  orgId: number | null;
  roleId: number;
  firstName: string;
  lastName?: string;
  email: string;
  mobile?: string;
  passwordHash: string;
}

export const userRepository = {
  async create(data: CreateUserInput) {
    const { rows } = await pool.query(
      `INSERT INTO users (org_id, role_id, first_name, last_name, email, mobile, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [data.orgId, data.roleId, data.firstName, data.lastName ?? null, data.email, data.mobile ?? null, data.passwordHash]
    );
    return rows[0];
  },

  async findByEmail(email: string) {
    const { rows } = await pool.query(
      `SELECT u.*, r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.email = $1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(userId: number) {
    const { rows } = await pool.query(
      `SELECT u.*, r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id WHERE u.user_id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async findByIdAndOrg(userId: number, orgId: number) {
    const { rows } = await pool.query(
      `SELECT u.*, r.role_name FROM users u JOIN roles r ON r.role_id = u.role_id
       WHERE u.user_id = $1 AND u.org_id = $2`,
      [userId, orgId]
    );
    return rows[0] ?? null;
  },

  async listByOrg(orgId: number | null, pagination: PaginationParams) {
    const { limit, offset, search, sortBy, sortOrder } = pagination;
    const params: unknown[] = [];
    const whereClauses: string[] = [];

    if (orgId !== null) {
      params.push(orgId);
      whereClauses.push(`u.org_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users u ${where}`,
      params
    );
    params.push(limit);
    params.push(offset);
    const { rows } = await pool.query(
      `SELECT u.user_id, u.user_uuid, u.org_id, u.role_id, r.role_name, u.first_name, u.last_name,
              u.email, u.mobile, u.status, u.last_login_at, u.created_at, u.updated_at
       FROM users u JOIN roles r ON r.role_id = u.role_id
       ${where}
       ORDER BY ${sortBy === "role_id" ? "u." + sortBy : "u." + sortBy} ${sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { rows, total: countResult.rows[0].count as number };
  },

  async update(userId: number, data: Partial<{ firstName: string; lastName: string; mobile: string; status: string; roleId: number }>) {
    const map: Record<string, string> = {
      firstName: "first_name",
      lastName: "last_name",
      mobile: "mobile",
      status: "status",
      roleId: "role_id",
    };
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${map[key]} = $${params.length}`);
    });
    if (fields.length === 0) return this.findById(userId);
    params.push(userId);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at = now() WHERE user_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },

  async updatePassword(userId: number, passwordHash: string) {
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE user_id = $2`, [passwordHash, userId]);
  },

  async updateLastLogin(userId: number) {
    await pool.query(`UPDATE users SET last_login_at = now() WHERE user_id = $1`, [userId]);
  },

  async remove(userId: number) {
    await pool.query(`UPDATE users SET status = 'INACTIVE', updated_at = now() WHERE user_id = $1`, [userId]);
  },
};
