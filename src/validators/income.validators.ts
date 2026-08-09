import { z } from "zod";

export const createIncomeSchema = z.object({
  paidByUserId: z.number().int().positive(),
  amount: z.number().positive("Amount must be greater than 0"),
  incomeDate: z.string().min(1, "Income date is required"),
  description: z.string().max(1000).optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();
