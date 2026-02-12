import { z } from "zod";

export const instrumentListSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

export const instrumentCreateSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional()
});

export const instrumentUpdateSchema = instrumentCreateSchema.partial();

export const courseListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  instrumentId: z.string().uuid().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sortBy: z.enum(["instrument", "difficulty", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

export const courseCreateSchema = z.object({
  instrumentId: z.string().uuid(),
  name: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const courseTeacherCreateSchema = z.object({
  teacherId: z.string().uuid()
});
