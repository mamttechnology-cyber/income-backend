import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../constants/errors";
import { permissionRepository } from "../repositories/permission.repository";

/**
 * Dynamic permission check. Never branches on role name -- it asks the
 * database whether the caller's role has this permission code, via
 * roles -> role_permissions -> permissions.
 */
export function authorizePermission(permissionCode: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const allowed = await permissionRepository.roleHasPermission(
        req.user.role,
        permissionCode
      );
      if (!allowed) {
        throw new ForbiddenError();
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
