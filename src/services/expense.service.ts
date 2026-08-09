import { expenseRepository } from "../repositories/expense.repository";
import { NotFoundError } from "../constants/errors";
import { PaginationParams } from "../utils/pagination";
import { notificationService } from "./notification.service";

export const expenseService = {
  async createExpense(orgId: number, createdBy: number, data: { amount: number; expenseDate: string; reason: string }) {
    const expense = await expenseRepository.create({ orgId, createdBy, ...data });

    await notificationService.send({
      userId: createdBy,
      templateCode: "EXPENSE_CREATED_EMAIL",
      vars: { amount: String(data.amount), date: data.expenseDate },
    });

    return expense;
  },

  async listExpenses(orgId: number, pagination: PaginationParams, from?: string, to?: string) {
    return expenseRepository.listByOrg(orgId, pagination, from, to);
  },

  async getExpense(expenseId: number, orgId: number) {
    const expense = await expenseRepository.findByIdAndOrg(expenseId, orgId);
    if (!expense) throw new NotFoundError("Expense not found");
    return expense;
  },

  async updateExpense(expenseId: number, orgId: number, updatedBy: number, data: Partial<{ amount: number; expenseDate: string; reason: string }>) {
    await this.getExpense(expenseId, orgId);
    return expenseRepository.update(expenseId, orgId, data, updatedBy);
  },

  async deleteExpense(expenseId: number, orgId: number) {
    await this.getExpense(expenseId, orgId);
    await expenseRepository.remove(expenseId, orgId);
  },
};
