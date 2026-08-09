import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { ok, created } from "../utils/response";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { UnauthorizedError, ForbiddenError } from "../constants/errors";
import { auditRepository } from "../repositories/audit.repository";

// For SUPER_ADMIN (orgId null), an explicit ?orgId= query param scopes the list;
// for ADMIN/USER, org is always forced from their own token, never from the client.
function resolveTargetOrgId(req: Request): number | null {
  if (!req.user) throw new UnauthorizedError();
  if (req.user.orgId !== null) return req.user.orgId;
  const q = req.query.orgId ? Number(req.query.orgId) : null;
  return q;
}

export const userController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = resolveTargetOrgId(req);
      const pagination = parsePagination(req, ["first_name", "email", "created_at"], "created_at");
      const { rows, total } = await userService.listUsers(orgId, pagination);
      return ok(res, { items: rows, meta: buildPaginationMeta(pagination.page, pagination.limit, total) });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = resolveTargetOrgId(req);
      const user = await userService.getUser(Number(req.params.id), orgId);
      return ok(res, user);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const targetOrgId = req.user.orgId !== null ? req.user.orgId : (req.body.orgId ?? null);
      if (targetOrgId === null) throw new ForbiddenError("orgId is required when creating a user as SUPER_ADMIN");

      const user = await userService.createUser({
        actingOrgId: req.user.orgId,
        orgId: targetOrgId,
        roleName: req.body.roleName,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        mobile: req.body.mobile,
      });
      await auditRepository.log({ userId: req.user.userId, orgId: req.user.orgId, action: "CREATE", module: "USER", recordId: user.user_id });
      return created(res, user, "User created successfully. A welcome email has been sent.");
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = resolveTargetOrgId(req);
      const user = await userService.updateUser(Number(req.params.id), orgId, req.body);
      await auditRepository.log({ userId: req.user?.userId, orgId: req.user?.orgId, action: "UPDATE", module: "USER", recordId: Number(req.params.id) });
      return ok(res, user, "User updated successfully");
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = resolveTargetOrgId(req);
      await userService.deleteUser(Number(req.params.id), orgId);
      await auditRepository.log({ userId: req.user?.userId, orgId: req.user?.orgId, action: "DELETE", module: "USER", recordId: Number(req.params.id) });
      return ok(res, null, "User deleted successfully");
    } catch (err) { next(err); }
  },
};
