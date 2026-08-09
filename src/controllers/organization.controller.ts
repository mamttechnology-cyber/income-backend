import { Request, Response, NextFunction } from "express";
import { organizationService } from "../services/organization.service";
import { ok, created } from "../utils/response";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { auditRepository } from "../repositories/audit.repository";

export const organizationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req, ["name", "org_code", "created_at"], "created_at");
      const { rows, total } = await organizationService.listOrganizations(pagination);
      return ok(res, { items: rows, meta: buildPaginationMeta(pagination.page, pagination.limit, total) });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.getOrganization(Number(req.params.id));
      return ok(res, org);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await organizationService.createOrganizationWithAdmin(req.body);
      await auditRepository.log({
        userId: req.user?.userId, action: "CREATE", module: "ORGANIZATION", recordId: result.organization.org_id,
        description: `Created organization ${result.organization.name} with admin ${result.admin.email}`,
      });
      return created(res, { organization: result.organization, admin: result.admin }, "Organization created successfully");
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.updateOrganization(Number(req.params.id), req.body);
      await auditRepository.log({ userId: req.user?.userId, action: "UPDATE", module: "ORGANIZATION", recordId: Number(req.params.id) });
      return ok(res, org, "Organization updated successfully");
    } catch (err) { next(err); }
  },

  async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.setStatus(Number(req.params.id), req.body.status);
      return ok(res, org, `Organization ${req.body.status === "ACTIVE" ? "activated" : "deactivated"} successfully`);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await organizationService.deleteOrganization(Number(req.params.id));
      await auditRepository.log({ userId: req.user?.userId, action: "DELETE", module: "ORGANIZATION", recordId: Number(req.params.id) });
      return ok(res, null, "Organization deleted successfully");
    } catch (err) { next(err); }
  },
};
