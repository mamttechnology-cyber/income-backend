import { Request, Response, NextFunction } from "express";
import { permissionService } from "../services/permission.service";
import { ok } from "../utils/response";

export const permissionController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { return ok(res, await permissionService.listPermissions()); } catch (err) { next(err); }
  },
};
