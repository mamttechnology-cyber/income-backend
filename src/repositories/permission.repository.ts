import { pool } from "../config/database";

export const permissionRepository = {
  async roleHasPermission(roleName: string, permissionCode: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1
       FROM role_permissions rp
       JOIN roles r ON r.role_id = rp.role_id
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE r.role_name = $1 AND p.permission_code = $2
       LIMIT 1`,
      [roleName, permissionCode]
    );
    return (rows.length ?? 0) > 0;
  },

  async getPermissionCodesForRole(roleName: string): Promise<string[]> {
    const { rows } = await pool.query(
      `SELECT p.permission_code
       FROM role_permissions rp
       JOIN roles r ON r.role_id = rp.role_id
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE r.role_name = $1`,
      [roleName]
    );
    return rows.map((r) => r.permission_code);
  },

  async listAll() {
    const { rows } = await pool.query(
      `SELECT permission_id, permission_code, permission_name, description, menu_id
       FROM permissions ORDER BY permission_id`
    );
    return rows;
  },

  async getPermissionIdsForRole(roleId: number): Promise<number[]> {
    const { rows } = await pool.query(
      `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
      [roleId]
    );
    return rows.map((r) => r.permission_id);
  },

  async setPermissionsForRole(roleId: number, permissionIds: number[]) {
    await pool.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    if (permissionIds.length === 0) return;
    const values: string[] = [];
    const params: unknown[] = [];
    permissionIds.forEach((pid, idx) => {
      values.push(`($${idx * 2 + 1}, $${idx * 2 + 2})`);
      params.push(roleId, pid);
    });
    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values.join(",")}`,
      params
    );
  },
};
