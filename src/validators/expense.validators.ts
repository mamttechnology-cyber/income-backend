import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Expense date is required"),
  reason: z.string().min(1, "Reason is required").max(1000),
});

export const updateExpenseSchema = createExpenseSchema.partial();
