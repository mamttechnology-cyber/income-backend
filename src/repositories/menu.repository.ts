import { pool } from "../config/database";

export const menuRepository = {
  async getMenusForRole(roleName: string) {
    const { rows } = await pool.query(
      `SELECT DISTINCT m.menu_id, m.parent_menu_id, m.menu_name, m.menu_code,
              m.menu_path, m.icon, m.display_order,
              bool_or(p.permission_code LIKE '%_VIEW') AS can_view,
              bool_or(p.permission_code LIKE '%_CREATE') AS can_create,
              bool_or(p.permission_code LIKE '%_UPDATE') AS can_update,
              bool_or(p.permission_code LIKE '%_DELETE') AS can_delete
       FROM menus m
       JOIN permissions p ON p.menu_id = m.menu_id
       JOIN role_permissions rp ON rp.permission_id = p.permission_id
       JOIN roles r ON r.role_id = rp.role_id
       WHERE r.role_name = $1 AND m.status = 'ACTIVE'
       GROUP BY m.menu_id
       ORDER BY m.display_order`,
      [roleName]
    );
    return rows;
  },

  async listAll() {
    const { rows } = await pool.query(
      `SELECT * FROM menus ORDER BY parent_menu_id NULLS FIRST, display_order`
    );
    return rows;
  },
};
