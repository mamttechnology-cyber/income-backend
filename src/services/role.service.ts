import { roleRepository } from "../repositories/role.repository";
import { permissionRepository } from "../repositories/permission.repository";
import { NotFoundError, ConflictError, ForbiddenError } from "../constants/errors";

export const roleService = {
  async listRoles() {
    return roleRepository.listAll();
  },
  async createRole(roleName: string, description?: string) {
    const existing = await roleRepository.findByName(roleName);
    if (existing) throw new ConflictError("A role with this name already exists");
    return roleRepository.create(roleName, description);
  },
  async updateRole(roleId: number, data: Partial<{ description: string; status: string }>) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found");
    return roleRepository.update(roleId, data);
  },
  async deleteRole(roleId: number) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found");
    if (["SUPER_ADMIN", "ADMIN", "USER"].includes(role.role_name)) {
      throw new ForbiddenError("System roles cannot be deleted. Please contact the system administrator.");
    }
    await roleRepository.remove(roleId);
  },
  async getRolePermissions(roleId: number) {
    return permissionRepository.getPermissionIdsForRole(roleId);
  },
  async setRolePermissions(roleId: number, permissionIds: number[]) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found");
    await permissionRepository.setPermissionsForRole(roleId, permissionIds);
  },
};
