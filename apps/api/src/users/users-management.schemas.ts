import { z } from "zod";
import { PAGINATION_MAX_PAGE_SIZE } from "../common/pagination";

export const userListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(PAGINATION_MAX_PAGE_SIZE).optional(),
  search: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sortBy: z.enum(["createdAt", "lastName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

export const userProfilePatchSchema = z.object({
  department: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  admissionId: z.string().uuid().optional().nullable(),
  primaryInstrument: z.string().optional().nullable(),
  secondaryInstruments: z.array(z.string()).optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const userCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  isActive: z.boolean().optional()
});

export const userAttendanceSchema = z.object({
  workDate: z.string(),
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().optional()
});

export const studentProgressSchema = z.object({
  skillArea: z.string().min(1),
  level: z.string().min(1),
  notes: z.string().optional()
});
