import { z } from "zod";

export const createUserSchema = z.object({
  orgId: z.number().int().positive().nullable().optional(),
  roleName: z.enum(["ADMIN", "USER"]),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email(),
  mobile: z.string().min(7).max(20).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  mobile: z.string().min(7).max(20).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  roleName: z.enum(["ADMIN", "USER"]).optional(),
});
