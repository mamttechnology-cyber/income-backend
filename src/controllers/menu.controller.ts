import { Request, Response, NextFunction } from "express";
import { menuService } from "../services/menu.service";
import { ok } from "../utils/response";
import { UnauthorizedError } from "../constants/errors";

export const menuController = {
  async myMenus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const menus = await menuService.getMyMenus(req.user.role);
      return ok(res, { menus });
    } catch (err) { next(err); }
  },
  async listAll(_req: Request, res: Response, next: NextFunction) {
    try { return ok(res, await menuService.listAllMenus()); } catch (err) { next(err); }
  },
};
