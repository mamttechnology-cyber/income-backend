import { z } from "zod";

export const createRoleSchema = z.object({
  roleName: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
});

export const updateRoleSchema = z.object({
  description: z.string().max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const setRolePermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
});
