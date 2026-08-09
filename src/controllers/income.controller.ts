import { Request, Response, NextFunction } from "express";
import { incomeService } from "../services/income.service";
import { ok, created } from "../utils/response";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { UnauthorizedError } from "../constants/errors";
import { auditRepository } from "../repositories/audit.repository";

// Organization id ALWAYS comes from the authenticated user's JWT, never
// from the request body/params/query -- this is what enforces
// organization isolation for every income/expense endpoint.
function requireOrgId(req: Request): number {
  if (!req.user || req.user.orgId === null) throw new UnauthorizedError("This action requires an organization-scoped account");
  return req.user.orgId;
}

export const incomeController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const pagination = parsePagination(req, ["income_date", "amount", "created_at"], "income_date");
      const { rows, total } = await incomeService.listIncomes(orgId, pagination, req.query.from as string, req.query.to as string);
      return ok(res, { items: rows, meta: buildPaginationMeta(pagination.page, pagination.limit, total) });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const income = await incomeService.getIncome(Number(req.params.id), orgId);
      return ok(res, income);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const income = await incomeService.createIncome(orgId, req.user!.userId, req.body);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "CREATE", module: "INCOME", recordId: income.income_id });
      return created(res, income, "Income created successfully");
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const income = await incomeService.updateIncome(Number(req.params.id), orgId, req.user!.userId, req.body);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "UPDATE", module: "INCOME", recordId: Number(req.params.id) });
      return ok(res, income, "Income updated successfully");
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      await incomeService.deleteIncome(Number(req.params.id), orgId);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "DELETE", module: "INCOME", recordId: Number(req.params.id) });
      return ok(res, null, "Income deleted successfully");
    } catch (err) { next(err); }
  },
};
