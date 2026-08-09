import { permissionRepository } from "../repositories/permission.repository";

export const permissionService = {
  async listPermissions() {
    return permissionRepository.listAll();
  },
};
