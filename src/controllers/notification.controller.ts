import { Request, Response, NextFunction } from "express";
import { notificationRepository } from "../repositories/notification.repository";
import { ok } from "../utils/response";
import { UnauthorizedError, NotFoundError } from "../constants/errors";

export const notificationController = {
  async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const limit = Math.min(100, Number(req.query.limit) || 20);
      const page = Math.max(1, Number(req.query.page) || 1);
      const { rows, total } = await notificationRepository.listByOrg(req.user.orgId, limit, (page - 1) * limit);
      return ok(res, { items: rows, meta: { page, limit, total } });
    } catch (err) { next(err); }
  },

  async listTemplates(_req: Request, res: Response, next: NextFunction) {
    try { return ok(res, await notificationRepository.listTemplates()); } catch (err) { next(err); }
  },

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await notificationRepository.updateTemplate(Number(req.params.id), req.body);
      if (!template) throw new NotFoundError("Notification template not found");
      return ok(res, template, "Notification template updated successfully");
    } catch (err) { next(err); }
  },

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await notificationRepository.ensurePreferences(req.user.userId, req.user.orgId);
      const prefs = await notificationRepository.getPreferences(req.user.userId);
      return ok(res, prefs);
    } catch (err) { next(err); }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await notificationRepository.ensurePreferences(req.user.userId, req.user.orgId);
      const prefs = await notificationRepository.updatePreferences(req.user.userId, req.body);
      return ok(res, prefs, "Notification preferences updated");
    } catch (err) { next(err); }
  },
};
