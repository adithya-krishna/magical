import { z } from "zod";
import { PAGINATION_MAX_PAGE_SIZE } from "../common/pagination";
import { LEAD_STAGE_COLORS } from "./lead-stage-colors";

export const leadListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(PAGINATION_MAX_PAGE_SIZE).optional(),
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
  color: z.enum(LEAD_STAGE_COLORS),
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
