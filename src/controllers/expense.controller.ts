import { Request, Response, NextFunction } from "express";
import { expenseService } from "../services/expense.service";
import { ok, created } from "../utils/response";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { UnauthorizedError } from "../constants/errors";
import { auditRepository } from "../repositories/audit.repository";

function requireOrgId(req: Request): number {
  if (!req.user || req.user.orgId === null) throw new UnauthorizedError("This action requires an organization-scoped account");
  return req.user.orgId;
}

export const expenseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const pagination = parsePagination(req, ["expense_date", "amount", "created_at"], "expense_date");
      const { rows, total } = await expenseService.listExpenses(orgId, pagination, req.query.from as string, req.query.to as string);
      return ok(res, { items: rows, meta: buildPaginationMeta(pagination.page, pagination.limit, total) });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const expense = await expenseService.getExpense(Number(req.params.id), orgId);
      return ok(res, expense);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const expense = await expenseService.createExpense(orgId, req.user!.userId, req.body);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "CREATE", module: "EXPENSE", recordId: expense.expense_id });
      return created(res, expense, "Expense created successfully");
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      const expense = await expenseService.updateExpense(Number(req.params.id), orgId, req.user!.userId, req.body);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "UPDATE", module: "EXPENSE", recordId: Number(req.params.id) });
      return ok(res, expense, "Expense updated successfully");
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = requireOrgId(req);
      await expenseService.deleteExpense(Number(req.params.id), orgId);
      await auditRepository.log({ userId: req.user!.userId, orgId, action: "DELETE", module: "EXPENSE", recordId: Number(req.params.id) });
      return ok(res, null, "Expense deleted successfully");
    } catch (err) { next(err); }
  },
};
