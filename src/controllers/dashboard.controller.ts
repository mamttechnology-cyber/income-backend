import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";
import { ok } from "../utils/response";
import { UnauthorizedError } from "../constants/errors";

export const dashboardController = {
  async userDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await dashboardService.userDashboard(req.user.orgId, req.user.userId, req.query.from as string, req.query.to as string);
      return ok(res, result);
    } catch (err) { next(err); }
  },

  async organizationDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await dashboardService.organizationDashboard(req.user.orgId, req.query.from as string, req.query.to as string);
      return ok(res, result);
    } catch (err) { next(err); }
  },
};
