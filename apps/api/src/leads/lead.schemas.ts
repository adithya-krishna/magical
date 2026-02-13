import { z } from "zod";

export const leadListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  stageId: z.string().uuid().optional(),
  excludeOnboarded: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  ownerId: z.string().uuid().optional(),
  source: z.string().optional(),
  followUpStatus: z.enum(["open", "done"]).optional(),
  followUpFrom: z.string().optional(),
  followUpTo: z.string().optional()
});

export const leadCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  interest: z.string().optional(),
  source: z.string().optional(),
  stageId: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  followUpDate: z.string(),
  followUpStatus: z.enum(["open", "done"]).optional()
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadStageSchema = z.object({
  name: z.string().min(1),
  ordering: z.number().int().min(0),
  isOnboarded: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const leadBulkRowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  interest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional()
});
