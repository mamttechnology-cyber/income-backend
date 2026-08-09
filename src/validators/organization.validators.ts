import { z } from "zod";

export const createOrganizationSchema = z.object({
  orgCode: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  email: z.string().email().optional(),
  mobile: z.string().min(7).max(20).optional(),
  address: z.string().max(500).optional(),
  adminFirstName: z.string().min(1).max(100),
  adminLastName: z.string().max(100).optional(),
  adminEmail: z.string().email(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(7).max(20).optional(),
  address: z.string().max(500).optional(),
});

export const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
