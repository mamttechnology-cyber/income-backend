import { z } from "zod";

export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  incomeNotification: z.boolean().optional(),
  expenseNotification: z.boolean().optional(),
  passwordNotification: z.boolean().optional(),
  accountNotification: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  templateName: z.string().min(1).max(150).optional(),
  subject: z.string().max(255).nullable().optional(),
  bodyTemplate: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
