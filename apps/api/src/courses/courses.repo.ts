import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  sql,
  type SQL
} from "drizzle-orm";
import { db } from "../db";
import { courseTeachers, courses, instruments, users } from "../db/schema";
import type {
  CourseCreateInput,
  CourseListFilters,
  CourseUpdateInput
} from "./courses.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export async function listCourses(
  filters: CourseListFilters,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const whereClauses = [] as SQL[];

  if (filters.search) {
    whereClauses.push(ilike(courses.name, `%${filters.search}%`));
  }
  if (filters.instrumentId) {
    whereClauses.push(eq(courses.instrumentId, filters.instrumentId));
  }
  if (filters.difficulty) {
    whereClauses.push(eq(courses.difficulty, filters.difficulty));
  }
  if (typeof filters.isActive === "boolean") {
    whereClauses.push(eq(courses.isActive, filters.isActive));
  }

  const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;
  const offset = (page - 1) * pageSize;

  const sortOrder = filters.sortOrder === "desc" ? desc : asc;
  const sortBy = filters.sortBy ?? "name";

  const orderBy =
    sortBy === "instrument"
      ? sortOrder(instruments.name)
      : sortBy === "difficulty"
        ? sortOrder(courses.difficulty)
        : sortOrder(courses.name);

  const data = await db
    .select({
      id: courses.id,
      instrumentId: courses.instrumentId,
      instrumentName: instruments.name,
      name: courses.name,
      difficulty: courses.difficulty,
      description: courses.description,
      isActive: courses.isActive,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt
    })
    .from(courses)
    .innerJoin(instruments, eq(courses.instrumentId, instruments.id))
    .where(where)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db
    .select({ total: count() })
    .from(courses)
    .innerJoin(instruments, eq(courses.instrumentId, instruments.id))
    .where(where);

  return {
    data,
    total: totalResult[0]?.total ?? 0
  };
}

export async function getCourseById(id: string) {
  const result = await db
    .select({
      id: courses.id,
      instrumentId: courses.instrumentId,
      instrumentName: instruments.name,
      name: courses.name,
      difficulty: courses.difficulty,
      description: courses.description,
      isActive: courses.isActive,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt
    })
    .from(courses)
    .innerJoin(instruments, eq(courses.instrumentId, instruments.id))
    .where(eq(courses.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function createCourse(input: CourseCreateInput) {
  const result = await db
    .insert(courses)
    .values({
      instrumentId: input.instrumentId,
      name: input.name,
      difficulty: input.difficulty,
      description: input.description,
      isActive: input.isActive ?? true
    })
    .returning();

  return result[0];
}

export async function updateCourse(id: string, patch: CourseUpdateInput) {
  const result = await db
    .update(courses)
    .set({
      ...patch,
      updatedAt: sql`now()`
    })
    .where(eq(courses.id, id))
    .returning();

  return result[0] ?? null;
}

export async function archiveCourse(id: string) {
  const result = await db
    .update(courses)
    .set({
      isActive: false,
      updatedAt: sql`now()`
    })
    .where(eq(courses.id, id))
    .returning();

  return result[0] ?? null;
}

export async function listCourseTeachers(courseId: string) {
  return db
    .select({
      teacherId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    })
    .from(courseTeachers)
    .innerJoin(users, eq(courseTeachers.teacherId, users.id))
    .where(
      and(
        eq(courseTeachers.courseId, courseId),
        eq(users.role, "teacher"),
        isNull(users.deletedAt)
      )
    )
    .orderBy(asc(users.firstName), asc(users.lastName));
}

export async function addCourseTeacher(courseId: string, teacherId: string) {
  const result = await db
    .insert(courseTeachers)
    .values({ courseId, teacherId })
    .returning();

  return result[0];
}

export async function removeCourseTeacher(courseId: string, teacherId: string) {
  const result = await db
    .delete(courseTeachers)
    .where(and(eq(courseTeachers.courseId, courseId), eq(courseTeachers.teacherId, teacherId)))
    .returning();

  return result[0] ?? null;
}

export async function getTeachersByIds(teacherIds: string[]) {
  if (teacherIds.length === 0) {
    return [];
  }

  return db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(inArray(users.id, teacherIds), isNull(users.deletedAt)));
}
