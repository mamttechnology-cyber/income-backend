import { Request, Response, NextFunction } from "express";
import { roleService } from "../services/role.service";
import { ok, created } from "../utils/response";

export const roleController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { return ok(res, await roleService.listRoles()); } catch (err) { next(err); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.createRole(req.body.roleName, req.body.description);
      return created(res, role, "Role created successfully");
    } catch (err) { next(err); }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.updateRole(Number(req.params.id), req.body);
      return ok(res, role, "Role updated successfully");
    } catch (err) { next(err); }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.deleteRole(Number(req.params.id));
      return ok(res, null, "Role deleted successfully");
    } catch (err) { next(err); }
  },
  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await roleService.getRolePermissions(Number(req.params.roleId));
      return ok(res, { permissionIds: ids });
    } catch (err) { next(err); }
  },
  async setPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.setRolePermissions(Number(req.params.roleId), req.body.permissionIds);
      return ok(res, null, "Role permissions updated successfully");
    } catch (err) { next(err); }
  },
};
