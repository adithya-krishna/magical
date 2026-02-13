import { z } from "zod";

export const weeklySlotSchema = z.object({
  timeSlotId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional()
});

export const admissionListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(),
  coursePlanId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional()
});

export const admissionCreateSchema = z.object({
  leadId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  walkInStudent: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(5).optional(),
      password: z.string().min(8)
    })
    .optional(),
  coursePlanId: z.string().uuid(),
  courseId: z.string().uuid(),
  startDate: z.string(),
  weeklySlots: z.array(weeklySlotSchema).min(1),
  extraClasses: z.number().int().min(0).optional(),
  discountType: z.enum(["percent", "amount", "none"]).optional(),
  discountValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional()
}).superRefine((value, ctx) => {
  if (!value.leadId && !value.walkInStudent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either leadId or walkInStudent is required",
      path: ["leadId"]
    });
  }

  if (value.walkInStudent && value.studentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "studentId cannot be provided with walkInStudent",
      path: ["studentId"]
    });
  }
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
  price: z.number().int().min(0),
  durationMonths: z.number().int().min(1),
  classesPerWeek: z.number().int().min(1).optional(),
  isActive: z.boolean().optional()
});

export const coursePlanUpdateSchema = coursePlanCreateSchema.partial();

export const admissionPrerequisitesSchema = z.object({
  courseId: z.string().uuid().optional(),
  leadSearch: z.string().optional()
});
