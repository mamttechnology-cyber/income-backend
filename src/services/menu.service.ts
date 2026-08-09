import { menuRepository } from "../repositories/menu.repository";

export const menuService = {
  async getMyMenus(roleName: string) {
    const flatMenus = await menuRepository.getMenusForRole(roleName);
    return buildMenuTree(flatMenus);
  },
  async listAllMenus() {
    return menuRepository.listAll();
  },
};

function buildMenuTree(flatMenus: any[]) {
  const byId = new Map<number, any>();
  flatMenus.forEach((m) => {
    byId.set(m.menu_id, {
      menuId: m.menu_id,
      menuCode: m.menu_code,
      menuName: m.menu_name,
      path: m.menu_path,
      icon: m.icon,
      displayOrder: m.display_order,
      permissions: {
        view: Boolean(m.can_view),
        create: Boolean(m.can_create),
        update: Boolean(m.can_update),
        delete: Boolean(m.can_delete),
      },
      children: [] as any[],
    });
  });

  const roots: any[] = [];
  flatMenus.forEach((m) => {
    const node = byId.get(m.menu_id);
    if (m.parent_menu_id && byId.has(m.parent_menu_id)) {
      byId.get(m.parent_menu_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => a.displayOrder - b.displayOrder);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}
