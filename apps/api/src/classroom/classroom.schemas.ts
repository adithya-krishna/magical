import { z } from "zod";

export const operatingDayUpdateSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean()
  })
);

export const timeSlotListSchema = z.object({
  day: z.coerce.number().int().min(0).max(6).optional()
});

export const timeSlotCreateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  durationMinutes: z.number().int().min(1),
  isActive: z.boolean().optional()
});

export const timeSlotUpdateSchema = timeSlotCreateSchema.partial();

export const classroomSlotListSchema = z.object({
  day: z.coerce.number().int().min(0).max(6).optional(),
  courseId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional()
});

export const classroomSlotCreateSchema = z.object({
  timeSlotId: z.string().uuid(),
  courseId: z.string().uuid(),
  teacherId: z.string().uuid(),
  capacity: z.number().int().min(1),
  isActive: z.boolean().optional()
});

export const classroomSlotUpdateSchema = classroomSlotCreateSchema.partial();

export const dashboardSchema = z.object({
  day: z.coerce.number().int().min(0).max(6).optional()
});

export const attendanceListSchema = z.object({
  date: z.string().optional()
});

export const attendanceUpsertSchema = z.union([
  z.object({
    attendanceId: z.string().uuid().optional(),
    studentId: z.string().uuid(),
    classDate: z.string().optional(),
    status: z.enum(["scheduled", "present", "absent", "late", "excused"])
  }),
  z.array(
    z.object({
      attendanceId: z.string().uuid().optional(),
      studentId: z.string().uuid(),
      classDate: z.string().optional(),
      status: z.enum(["scheduled", "present", "absent", "late", "excused"])
    })
  )
]);

export const attendanceUpdateSchema = z.object({
  status: z.enum(["scheduled", "present", "absent", "late", "excused"])
});

export const rescheduleCreateSchema = z.object({
  attendanceId: z.string().uuid(),
  requestedDate: z.string(),
  requestedSlotId: z.string().uuid().optional()
});

export const rescheduleListSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional()
});

export const rescheduleUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"])
});

export const studentFilterSchema = z.object({
  courseId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional()
});

export const classroomAssignmentSchema = z.object({
  studentId: z.string().uuid(),
  classroomSlotId: z.string().uuid(),
  startDate: z.string(),
  status: z.enum(["active", "paused", "ended"]).optional()
});
