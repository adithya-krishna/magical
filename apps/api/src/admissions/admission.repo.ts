import { and, desc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  admissionSlots,
  admissions,
  attendance,
  classroomEnrollments,
  classroomSlots,
  coursePlans,
  leadStages,
  leads,
  operatingDays,
  timeSlotTemplates,
  users
} from "../db/schema";
import type { AdmissionListFilters } from "./admission.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export async function listAdmissions(
  filters: AdmissionListFilters,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const whereClauses: Array<SQL | undefined> = [isNull(admissions.deletedAt)];

  if (filters.status) {
    whereClauses.push(eq(admissions.status, filters.status));
  }
  if (filters.coursePlanId) {
    whereClauses.push(eq(admissions.coursePlanId, filters.coursePlanId));
  }
  if (filters.createdFrom) {
    whereClauses.push(sql`${admissions.createdAt} >= ${filters.createdFrom}`);
  }
  if (filters.createdTo) {
    whereClauses.push(sql`${admissions.createdAt} <= ${filters.createdTo}`);
  }
  if (filters.ownerId) {
    whereClauses.push(eq(leads.ownerId, filters.ownerId));
  }

  const where = and(...whereClauses.filter(Boolean));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({ admission: admissions })
    .from(admissions)
    .leftJoin(leads, eq(admissions.leadId, leads.id))
    .where(where)
    .orderBy(desc(admissions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(admissions)
    .leftJoin(leads, eq(admissions.leadId, leads.id))
    .where(where);

  return {
    data: rows.map((row) => row.admission),
    total: Number(countResult[0]?.count ?? 0)
  };
}

export async function getAdmissionById(id: string) {
  const result = await db
    .select()
    .from(admissions)
    .where(and(eq(admissions.id, id), isNull(admissions.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function getAdmissionWithLead(id: string) {
  const result = await db
    .select({ admission: admissions, lead: leads })
    .from(admissions)
    .leftJoin(leads, eq(admissions.leadId, leads.id))
    .where(and(eq(admissions.id, id), isNull(admissions.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function getLeadWithStage(leadId: string) {
  const result = await db
    .select({ lead: leads, stage: leadStages })
    .from(leads)
    .leftJoin(leadStages, eq(leads.stageId, leadStages.id))
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function getCoursePlanById(id: string) {
  const result = await db
    .select()
    .from(coursePlans)
    .where(eq(coursePlans.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getTimeSlotTemplates(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  return db
    .select()
    .from(timeSlotTemplates)
    .where(inArray(timeSlotTemplates.id, ids));
}

export async function getOperatingDaysByWeekdays(weekdays: number[]) {
  if (weekdays.length === 0) {
    return [];
  }
  return db
    .select()
    .from(operatingDays)
    .where(inArray(operatingDays.dayOfWeek, weekdays));
}

export async function getClassroomSlotsForCourse(courseId: string, timeSlotIds: string[]) {
  if (timeSlotIds.length === 0) {
    return [];
  }

  return db
    .select()
    .from(classroomSlots)
    .where(
      and(
        eq(classroomSlots.courseId, courseId),
        inArray(classroomSlots.timeSlotId, timeSlotIds),
        eq(classroomSlots.isActive, true)
      )
    );
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

export async function createAdmissionTransaction(input: {
  admissionValues: typeof admissions.$inferInsert;
  timeSlotIds: string[];
  enrollments: Array<Omit<typeof classroomEnrollments.$inferInsert, "admissionId">>;
  attendanceRows: Array<typeof attendance.$inferInsert>;
}) {
  return db.transaction(async (tx) => {
    const created = await tx.insert(admissions).values(input.admissionValues).returning();
    const admission = created[0];

    if (!admission) {
      return null;
    }

    if (input.timeSlotIds.length > 0) {
      await tx.insert(admissionSlots).values(
        input.timeSlotIds.map((timeSlotId) => ({
          admissionId: admission.id,
          timeSlotId
        }))
      );
    }

    if (input.enrollments.length > 0) {
      await tx.insert(classroomEnrollments).values(
        input.enrollments.map((row) => ({
          ...row,
          admissionId: admission.id
        }))
      );
    }

    if (input.attendanceRows.length > 0) {
      await tx.insert(attendance).values(input.attendanceRows);
    }

    return admission;
  });
}

export async function updateAdmission(id: string, patch: Partial<typeof admissions.$inferInsert>) {
  const result = await db
    .update(admissions)
    .set({
      ...patch,
      updatedAt: new Date()
    })
    .where(and(eq(admissions.id, id), isNull(admissions.deletedAt)))
    .returning();
  return result[0] ?? null;
}

export async function softDeleteAdmission(id: string) {
  const result = await db
    .update(admissions)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(and(eq(admissions.id, id), isNull(admissions.deletedAt)))
    .returning();
  return result[0] ?? null;
}
