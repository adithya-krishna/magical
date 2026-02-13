import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { PAGINATION_DEFAULT_PAGE_SIZE } from "../common/pagination";
import { db } from "../db";
import {
  admissionSlots,
  admissions,
  attendance,
  classroomEnrollments,
  classroomSlots,
  courses,
  coursePlans,
  instruments,
  leadStages,
  leads,
  operatingDays,
  timeSlotTemplates,
  users
} from "../db/schema";
import type { AdmissionListFilters } from "./admission.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = PAGINATION_DEFAULT_PAGE_SIZE;

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
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchClause = or(
      ilike(leads.firstName, term),
      ilike(leads.lastName, term),
      ilike(leads.phone, term),
      ilike(leads.email, term)
    );
    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const where = and(...whereClauses.filter(Boolean));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({ admission: admissions, lead: leads })
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
    data: rows,
    total: Number(countResult[0]?.count ?? 0)
  };
}

export async function listNonOnboardedLeads(search?: string, ownerId?: string) {
  const whereClauses: Array<SQL | undefined> = [
    isNull(leads.deletedAt),
    eq(leadStages.isOnboarded, false),
    eq(leadStages.isActive, true)
  ];

  if (search) {
    const term = `%${search}%`;
    const searchClause = or(
      ilike(leads.firstName, term),
      ilike(leads.lastName, term),
      ilike(leads.phone, term),
      ilike(leads.email, term)
    );

    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  if (ownerId) {
    whereClauses.push(eq(leads.ownerId, ownerId));
  }

  const where = and(...whereClauses.filter(Boolean));

  return db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      phone: leads.phone,
      email: leads.email,
      stageId: leads.stageId,
      ownerId: leads.ownerId
    })
    .from(leads)
    .leftJoin(leadStages, eq(leads.stageId, leadStages.id))
    .where(where)
    .orderBy(desc(leads.createdAt));
}

export async function listAdmissionPrerequisites(
  courseId?: string,
  leadSearch?: string,
  ownerId?: string
) {
  const [leadsData, plans, coursesData, openDays] = await Promise.all([
    listNonOnboardedLeads(leadSearch, ownerId),
    db.select().from(coursePlans).where(eq(coursePlans.isActive, true)).orderBy(asc(coursePlans.durationMonths)),
    db
      .select({
        id: courses.id,
        name: courses.name,
        instrumentName: sql<string>`coalesce(${instruments.name}, '')`
      })
      .from(courses)
      .leftJoin(instruments, eq(courses.instrumentId, instruments.id))
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.name)),
    db.select().from(operatingDays).where(eq(operatingDays.isOpen, true)).orderBy(operatingDays.dayOfWeek)
  ]);

  const classroomJoinCondition = courseId
    ? and(
        eq(classroomSlots.timeSlotId, timeSlotTemplates.id),
        eq(classroomSlots.courseId, courseId),
        eq(classroomSlots.isActive, true)
      )
    : and(eq(classroomSlots.timeSlotId, timeSlotTemplates.id), eq(classroomSlots.isActive, true));

  const slotRows = await db
    .select({
      classroomSlotId: classroomSlots.id,
      timeSlotId: timeSlotTemplates.id,
      dayOfWeek: timeSlotTemplates.dayOfWeek,
      startTime: timeSlotTemplates.startTime,
      endTime: timeSlotTemplates.endTime,
      capacity: classroomSlots.capacity,
      occupancy: sql<number>`coalesce(count(${classroomEnrollments.id}), 0)`
    })
    .from(timeSlotTemplates)
    .leftJoin(classroomSlots, classroomJoinCondition)
    .leftJoin(
      classroomEnrollments,
      and(
        eq(classroomEnrollments.classroomSlotId, classroomSlots.id),
        eq(classroomEnrollments.status, "active")
      )
    )
    .where(eq(timeSlotTemplates.isActive, true))
    .groupBy(
      classroomSlots.id,
      timeSlotTemplates.id,
      timeSlotTemplates.dayOfWeek,
      timeSlotTemplates.startTime,
      timeSlotTemplates.endTime,
      classroomSlots.capacity
    )
    .orderBy(timeSlotTemplates.dayOfWeek, timeSlotTemplates.startTime);

  return {
    leads: leadsData,
    coursePlans: plans,
    courses: coursesData,
    operatingDays: openDays,
    slotOptions: slotRows
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

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

export async function getOnboardedLeadStage() {
  const result = await db
    .select()
    .from(leadStages)
    .where(and(eq(leadStages.isOnboarded, true), eq(leadStages.isActive, true)))
    .orderBy(leadStages.ordering)
    .limit(1);

  return result[0] ?? null;
}

export async function setLeadStage(leadId: string, stageId: string) {
  const result = await db
    .update(leads)
    .set({
      stageId,
      updatedAt: new Date()
    })
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function createLeadForAdmission(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  stageId: string;
  ownerId: string;
  notes?: string;
}) {
  const result = await db
    .insert(leads)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      source: "walk_in",
      stageId: input.stageId,
      ownerId: input.ownerId,
      notes: input.notes ?? null,
      followUpDate: new Date().toISOString().slice(0, 10),
      followUpStatus: "done"
    })
    .returning();

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
