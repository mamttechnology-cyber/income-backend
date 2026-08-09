import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ok } from "../utils/response";
import { UnauthorizedError } from "../constants/errors";
import { auditRepository } from "../repositories/audit.repository";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      await auditRepository.log({
        userId: result.user.userId, orgId: result.user.orgId, action: "LOGIN", module: "AUTH",
        ipAddress: req.ip, userAgent: req.headers["user-agent"],
      });
      return ok(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      return ok(res, result, "Token refreshed");
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await authService.logout(refreshToken);
      if (req.user) {
        await auditRepository.log({ userId: req.user.userId, orgId: req.user.orgId, action: "LOGOUT", module: "AUTH" });
      }
      return ok(res, null, "Logged out");
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await authService.me(req.user.userId);
      return ok(res, result);
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      return ok(res, null, "If that email is registered, a reset link has been sent");
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.newPassword);
      return ok(res, null, "Password has been reset. Please log in.");
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
      await auditRepository.log({ userId: req.user.userId, orgId: req.user.orgId, action: "PASSWORD_RESET", module: "AUTH" });
      return ok(res, null, "Password changed successfully");
    } catch (err) {
      next(err);
    }
  },
};
