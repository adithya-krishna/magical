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
  assignedTeacherId: z.string().uuid().optional(),
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
  area: z.string().optional(),
  community: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  expectedBudget: z.number().int().min(0).optional(),
  numberOfContactAttempts: z.number().int().min(0).optional(),
  lastContactedDate: z.string().datetime().optional(),
  nextFollowUp: z.string().datetime().optional(),
  walkInDate: z.string().optional(),
  assignedTeacherId: z.string().uuid().optional(),
  demoDate: z.string().optional(),
  demoConducted: z.boolean().optional(),
  interest: z.string().optional(),
  source: z.string().optional(),
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  followUpDate: z.string(),
  followUpStatus: z.enum(["open", "done"]).optional()
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadWorkflowSchema = z.object({
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  assignedTeacherId: z.string().uuid().optional(),
  walkInDate: z.string().nullable().optional(),
  followUpDate: z.string().optional(),
  nextFollowUp: z.string().datetime().nullable().optional(),
  demoDate: z.string().nullable().optional(),
  demoConducted: z.boolean().optional(),
  numberOfContactAttempts: z.number().int().min(0).optional(),
  lastContactedDate: z.string().datetime().nullable().optional()
});

export const leadProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  email: z.string().email().optional(),
  area: z.string().optional(),
  community: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  source: z.string().optional(),
  interest: z.string().optional(),
  expectedBudget: z.number().int().min(0).optional(),
  notes: z.string().optional()
});

export const leadNoteCreateSchema = z.object({
  body: z.string().trim().min(1)
});

export const leadTagsSchema = z.object({
  tags: z.array(z.string().trim().min(1)).max(20)
});

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
