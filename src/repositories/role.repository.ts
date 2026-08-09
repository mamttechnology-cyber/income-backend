import { pool } from "../config/database";

export const roleRepository = {
  async findByName(roleName: string) {
    const { rows } = await pool.query(`SELECT * FROM roles WHERE role_name = $1`, [roleName]);
    return rows[0] ?? null;
  },
  async findById(roleId: number) {
    const { rows } = await pool.query(`SELECT * FROM roles WHERE role_id = $1`, [roleId]);
    return rows[0] ?? null;
  },
  async listAll() {
    const { rows } = await pool.query(`SELECT * FROM roles ORDER BY role_id`);
    return rows;
  },
  async create(roleName: string, description?: string) {
    const { rows } = await pool.query(
      `INSERT INTO roles (role_name, description) VALUES ($1, $2) RETURNING *`,
      [roleName, description ?? null]
    );
    return rows[0];
  },
  async update(roleId: number, data: Partial<{ description: string; status: string }>) {
    const fields: string[] = [];
    const params: unknown[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      params.push(value);
      fields.push(`${key} = $${params.length}`);
    });
    if (fields.length === 0) return this.findById(roleId);
    params.push(roleId);
    const { rows } = await pool.query(
      `UPDATE roles SET ${fields.join(", ")}, updated_at = now() WHERE role_id = $${params.length} RETURNING *`,
      params
    );
    return rows[0] ?? null;
  },
  async remove(roleId: number) {
    await pool.query(`UPDATE roles SET status = 'INACTIVE', updated_at = now() WHERE role_id = $1`, [roleId]);
  },
};
