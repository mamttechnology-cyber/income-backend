import { incomeRepository } from "../repositories/income.repository";
import { expenseRepository } from "../repositories/expense.repository";
import { organizationRepository } from "../repositories/organization.repository";

export const dashboardService = {
  async userDashboard(orgId: number | null, userId: number, from?: string, to?: string) {
    const [totalIncome, totalExpenseAll, incomeMonthly] = await Promise.all([
      incomeRepository.sumForUser(orgId, userId, from, to),
      expenseRepository.sumForOrg(orgId, from, to),
      incomeRepository.monthlyTotalsForOrg(orgId, from, to),
    ]);
    // A user's personal balance is their own income contributions minus
    // nothing (expenses are organization-wide, not attributable to one
    // user), so we surface both numbers distinctly instead of subtracting.
    return {
      totalIncome,
      totalExpenseOrg: totalExpenseAll,
      incomeMonthly,
    };
  },

  async organizationDashboard(orgId: number | null, from?: string, to?: string) {
    const [totalIncome, totalExpense, totalUsers, incomeMonthly, expenseMonthly] = await Promise.all([
      incomeRepository.sumForOrg(orgId, from, to),
      expenseRepository.sumForOrg(orgId, from, to),
      organizationRepository.countUsers(orgId),
      incomeRepository.monthlyTotalsForOrg(orgId, from, to),
      expenseRepository.monthlyTotalsForOrg(orgId, from, to),
    ]);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalUsers,
      incomeMonthly,
      expenseMonthly,
    };
  },
};
