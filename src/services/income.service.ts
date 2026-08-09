import { incomeRepository } from "../repositories/income.repository";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError, ForbiddenError } from "../constants/errors";
import { PaginationParams } from "../utils/pagination";
import { notificationService } from "./notification.service";

export const incomeService = {
  async createIncome(orgId: number, createdBy: number, data: { paidByUserId: number; amount: number; incomeDate: string; description?: string }) {
    // The selected "paid by" user must belong to the same organization.
    const paidByUser = await userRepository.findByIdAndOrg(data.paidByUserId, orgId);
    if (!paidByUser) throw new ForbiddenError("Selected user does not belong to your organization");

    const income = await incomeRepository.create({ orgId, createdBy, ...data });

    await notificationService.send({
      userId: createdBy,
      templateCode: "INCOME_CREATED_EMAIL",
      vars: { amount: String(data.amount), date: data.incomeDate },
    });

    return income;
  },

  async listIncomes(orgId: number, pagination: PaginationParams, from?: string, to?: string) {
    return incomeRepository.listByOrg(orgId, pagination, from, to);
  },

  async getIncome(incomeId: number, orgId: number) {
    const income = await incomeRepository.findByIdAndOrg(incomeId, orgId);
    if (!income) throw new NotFoundError("Income not found");
    return income;
  },

  async updateIncome(incomeId: number, orgId: number, updatedBy: number, data: Partial<{ paidByUserId: number; amount: number; incomeDate: string; description: string }>) {
    await this.getIncome(incomeId, orgId);
    if (data.paidByUserId !== undefined) {
      const paidByUser = await userRepository.findByIdAndOrg(data.paidByUserId, orgId);
      if (!paidByUser) throw new ForbiddenError("Selected user does not belong to your organization");
    }
    return incomeRepository.update(incomeId, orgId, data, updatedBy);
  },

  async deleteIncome(incomeId: number, orgId: number) {
    await this.getIncome(incomeId, orgId);
    await incomeRepository.remove(incomeId, orgId);
  },
};
