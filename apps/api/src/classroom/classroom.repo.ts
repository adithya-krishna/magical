import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  attendance,
  courseTeachers,
  classroomEnrollments,
  classroomSlots,
  courses,
  operatingDays,
  rescheduleRequests,
  timeSlotTemplates,
  users,
  admissions
} from "../db/schema";
import type { ClassroomSlotFilters } from "./classroom.types";

export async function listOperatingDays() {
  return db.select().from(operatingDays).orderBy(operatingDays.dayOfWeek);
}

export async function updateOperatingDays(updates: Array<{ dayOfWeek: number; isOpen: boolean }>) {
  return db.transaction(async (tx) => {
    const results = [] as Array<typeof operatingDays.$inferSelect>;
    for (const update of updates) {
      const updated = await tx
        .update(operatingDays)
        .set({ isOpen: update.isOpen })
        .where(eq(operatingDays.dayOfWeek, update.dayOfWeek))
        .returning();
      if (updated[0]) {
        results.push(updated[0]);
      }
    }
    return results;
  });
}

export async function listTimeSlots(day?: number) {
  const where = day === undefined ? undefined : eq(timeSlotTemplates.dayOfWeek, day);
  return where
    ? db.select().from(timeSlotTemplates).where(where).orderBy(timeSlotTemplates.startTime)
    : db.select().from(timeSlotTemplates).orderBy(timeSlotTemplates.dayOfWeek, timeSlotTemplates.startTime);
}

export async function getTimeSlotById(id: string) {
  const result = await db.select().from(timeSlotTemplates).where(eq(timeSlotTemplates.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createTimeSlot(input: typeof timeSlotTemplates.$inferInsert) {
  const result = await db.insert(timeSlotTemplates).values(input).returning();
  return result[0];
}

export async function updateTimeSlot(id: string, patch: Partial<typeof timeSlotTemplates.$inferInsert>) {
  const result = await db
    .update(timeSlotTemplates)
    .set(patch)
    .where(eq(timeSlotTemplates.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deactivateTimeSlot(id: string) {
  const result = await db
    .update(timeSlotTemplates)
    .set({ isActive: false })
    .where(eq(timeSlotTemplates.id, id))
    .returning();
  return result[0] ?? null;
}

export async function listClassroomSlots(filters: ClassroomSlotFilters) {
  const conditions: Array<SQL | undefined> = [];

  if (filters.day !== undefined) {
    conditions.push(eq(timeSlotTemplates.dayOfWeek, filters.day));
  }
  if (filters.courseId) {
    conditions.push(eq(classroomSlots.courseId, filters.courseId));
  }
  if (filters.teacherId) {
    conditions.push(eq(classroomSlots.teacherId, filters.teacherId));
  }

  const where = conditions.length > 0 ? and(...conditions.filter(Boolean)) : undefined;

  const baseQuery = db
    .select({
      slot: classroomSlots,
      timeSlot: timeSlotTemplates,
      course: courses,
      teacher: users
    })
    .from(classroomSlots)
    .leftJoin(timeSlotTemplates, eq(classroomSlots.timeSlotId, timeSlotTemplates.id))
    .leftJoin(courses, eq(classroomSlots.courseId, courses.id))
    .leftJoin(users, eq(classroomSlots.teacherId, users.id));

  const rows = await (where ? baseQuery.where(where) : baseQuery).orderBy(
    timeSlotTemplates.dayOfWeek,
    timeSlotTemplates.startTime
  );

  return rows;
}

export async function getClassroomSlotById(id: string) {
  const result = await db
    .select()
    .from(classroomSlots)
    .where(eq(classroomSlots.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createClassroomSlot(input: typeof classroomSlots.$inferInsert) {
  const result = await db.insert(classroomSlots).values(input).returning();
  return result[0];
}

export async function updateClassroomSlot(id: string, patch: Partial<typeof classroomSlots.$inferInsert>) {
  const result = await db
    .update(classroomSlots)
    .set(patch)
    .where(eq(classroomSlots.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deactivateClassroomSlot(id: string) {
  const result = await db
    .update(classroomSlots)
    .set({ isActive: false })
    .where(eq(classroomSlots.id, id))
    .returning();
  return result[0] ?? null;
}

export async function countActiveEnrollments(classroomSlotIds: string[]) {
  if (classroomSlotIds.length === 0) {
    return [];
  }
  return db
    .select({
      classroomSlotId: classroomEnrollments.classroomSlotId,
      count: sql<number>`count(*)`
    })
    .from(classroomEnrollments)
    .where(
      and(
        inArray(classroomEnrollments.classroomSlotId, classroomSlotIds),
        eq(classroomEnrollments.status, "active")
      )
    )
    .groupBy(classroomEnrollments.classroomSlotId);
}

export async function listAttendanceBySlot(slotId: string, classDate?: string) {
  const where = classDate
    ? and(eq(attendance.classroomSlotId, slotId), eq(attendance.classDate, classDate))
    : eq(attendance.classroomSlotId, slotId);

  return db
    .select({ attendance, student: users })
    .from(attendance)
    .leftJoin(users, eq(attendance.studentId, users.id))
    .where(where)
    .orderBy(attendance.classDate, attendance.status);
}

export async function getAttendanceById(id: string) {
  const result = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAttendanceBySlotStudentDate(
  slotId: string,
  studentId: string,
  classDate: string
) {
  const result = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.classroomSlotId, slotId),
        eq(attendance.studentId, studentId),
        eq(attendance.classDate, classDate)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function insertAttendanceRows(rows: Array<typeof attendance.$inferInsert>) {
  if (rows.length === 0) {
    return [];
  }
  return db.insert(attendance).values(rows).returning();
}

export async function updateAttendanceById(id: string, patch: Partial<typeof attendance.$inferInsert>) {
  const result = await db
    .update(attendance)
    .set(patch)
    .where(eq(attendance.id, id))
    .returning();
  return result[0] ?? null;
}

export async function createRescheduleRequest(input: typeof rescheduleRequests.$inferInsert) {
  const result = await db.insert(rescheduleRequests).values(input).returning();
  return result[0];
}

export async function listRescheduleRequests(status?: "pending" | "approved" | "rejected") {
  const where = status ? eq(rescheduleRequests.status, status) : undefined;
  return where
    ? db.select().from(rescheduleRequests).where(where).orderBy(desc(rescheduleRequests.createdAt))
    : db.select().from(rescheduleRequests).orderBy(desc(rescheduleRequests.createdAt));
}

export async function getRescheduleRequestById(id: string) {
  const result = await db
    .select()
    .from(rescheduleRequests)
    .where(eq(rescheduleRequests.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function updateRescheduleRequest(
  id: string,
  patch: Partial<typeof rescheduleRequests.$inferInsert>
) {
  const result = await db
    .update(rescheduleRequests)
    .set({
      ...patch,
      updatedAt: new Date()
    })
    .where(eq(rescheduleRequests.id, id))
    .returning();
  return result[0] ?? null;
}

export async function createEnrollment(input: typeof classroomEnrollments.$inferInsert) {
  const result = await db.insert(classroomEnrollments).values(input).returning();
  return result[0];
}

export async function getEnrollmentByStudentAndSlot(studentId: string, classroomSlotId: string) {
  const result = await db
    .select()
    .from(classroomEnrollments)
    .where(and(eq(classroomEnrollments.studentId, studentId), eq(classroomEnrollments.classroomSlotId, classroomSlotId)))
    .limit(1);
  return result[0] ?? null;
}

export async function listStudentsByCourse(courseId: string) {
  return db
    .selectDistinct({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
    .from(users)
    .innerJoin(admissions, eq(admissions.studentId, users.id))
    .where(and(eq(users.role, "student"), eq(admissions.courseId, courseId), isNull(admissions.deletedAt)));
}

export async function getCourseById(id: string) {
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getClassroomSlotWithCourseTeacher(id: string) {
  const result = await db
    .select({ slot: classroomSlots, course: courses, teacher: users, timeSlot: timeSlotTemplates })
    .from(classroomSlots)
    .leftJoin(courses, eq(classroomSlots.courseId, courses.id))
    .leftJoin(users, eq(classroomSlots.teacherId, users.id))
    .leftJoin(timeSlotTemplates, eq(classroomSlots.timeSlotId, timeSlotTemplates.id))
    .where(eq(classroomSlots.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getClassroomSlotByTimeSlotAndCourse(timeSlotId: string, courseId: string) {
  const result = await db
    .select()
    .from(classroomSlots)
    .where(and(eq(classroomSlots.timeSlotId, timeSlotId), eq(classroomSlots.courseId, courseId)))
    .limit(1);
  return result[0] ?? null;
}

export async function existsClassroomSlotForCourseTeacher(courseId: string, teacherId: string) {
  const result = await db
    .select({ id: classroomSlots.id })
    .from(classroomSlots)
    .where(and(eq(classroomSlots.courseId, courseId), eq(classroomSlots.teacherId, teacherId)))
    .limit(1);
  return Boolean(result[0]);
}

export async function existsCourseTeacherAssignment(courseId: string, teacherId: string) {
  const result = await db
    .select({ id: courseTeachers.id })
    .from(courseTeachers)
    .where(and(eq(courseTeachers.courseId, courseId), eq(courseTeachers.teacherId, teacherId)))
    .limit(1);

  return Boolean(result[0]);
}

export async function getAdmissionForStudentCourse(studentId: string, courseId: string) {
  const result = await db
    .select()
    .from(admissions)
    .where(
      and(eq(admissions.studentId, studentId), eq(admissions.courseId, courseId), isNull(admissions.deletedAt))
    )
    .limit(1);
  return result[0] ?? null;
}
