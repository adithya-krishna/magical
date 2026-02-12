import { z } from "zod";

export const weeklySlotSchema = z.object({
  timeSlotId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional()
});

export const admissionListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  coursePlanId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional()
});

export const admissionCreateSchema = z.object({
  leadId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  coursePlanId: z.string().uuid(),
  courseId: z.string().uuid(),
  startDate: z.string(),
  weeklySlots: z.array(weeklySlotSchema).min(1),
  extraClasses: z.number().int().min(0).optional(),
  discountType: z.enum(["percent", "amount", "none"]).optional(),
  discountValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional()
});

export const admissionUpdateSchema = z
  .object({
    extraClasses: z.number().int().min(0).optional(),
    discountType: z.enum(["percent", "amount", "none"]).optional(),
    discountValue: z.number().min(0).optional(),
    notes: z.string().optional(),
    status: z.enum(["pending", "active", "completed", "cancelled"]).optional()
  })
  .partial();

export const coursePlanListSchema = z.object({
  isActive: z.coerce.boolean().optional()
});

export const coursePlanCreateSchema = z.object({
  name: z.string().min(1),
  durationMonths: z.number().int().min(1),
  classesPerWeek: z.number().int().min(1).optional(),
  isActive: z.boolean().optional()
});

export const coursePlanUpdateSchema = coursePlanCreateSchema.partial();
