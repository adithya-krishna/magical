import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL
} from "drizzle-orm";
import { PAGINATION_DEFAULT_PAGE_SIZE } from "../common/pagination";
import { db } from "../db";
import {
  accounts,
  rescheduleRequests,
  studentProgress,
  userAttendance,
  userProfiles,
  users
} from "../db/schema";
import type {
  ManagedRole,
  StudentProgressInput,
  UserAttendanceInput,
  UserListFilters,
  UserProfilePatch
} from "./users-management.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = PAGINATION_DEFAULT_PAGE_SIZE;

export async function listUsersByRole(
  role: ManagedRole,
  filters: UserListFilters,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const whereClauses = [eq(users.role, role)] as SQL[];
  whereClauses.push(isNull(users.deletedAt));

  if (typeof filters.isActive === "boolean") {
    whereClauses.push(eq(users.isActive, filters.isActive));
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchClause = or(
      ilike(users.firstName, term),
      ilike(users.lastName, term),
      ilike(users.email, term),
      ilike(users.phone, term)
    );

    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const where = and(...whereClauses);
  const offset = (page - 1) * pageSize;
  const sortOrder = filters.sortOrder === "asc" ? asc : desc;
  const sortColumn = filters.sortBy === "lastName" ? users.lastName : users.createdAt;

  const data = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(where)
    .orderBy(sortOrder(sortColumn))
    .limit(pageSize)
    .offset(offset);

  const totalRows = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  return { data, total: totalRows[0]?.total ?? 0 };
}

export async function getUserByRole(role: ManagedRole, id: string, includeDeleted = false) {
  const whereClauses = [eq(users.id, id), eq(users.role, role)] as SQL[];
  if (!includeDeleted) {
    whereClauses.push(isNull(users.deletedAt));
  }

  const result = await db
    .select({
      id: users.id,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      profile: userProfiles
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(...whereClauses))
    .limit(1);

  return result[0] ?? null;
}

export async function upsertUserProfile(role: ManagedRole, userId: string, patch: UserProfilePatch) {
  const existing = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing[0]) {
    const result = await db
      .update(userProfiles)
      .set({
        role,
        ...patch,
        updatedAt: sql`now()`
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    return result[0];
  }

  const created = await db
    .insert(userProfiles)
    .values({
      role,
      userId,
      ...patch
    })
    .returning();

  return created[0];
}

export async function softDeleteUserByRole(role: ManagedRole, userId: string) {
  const result = await db
    .update(users)
    .set({
      deletedAt: sql`now()`,
      isActive: false,
      updatedAt: sql`now()`
    })
    .where(and(eq(users.id, userId), eq(users.role, role), isNull(users.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function hardDeleteUserByRole(role: ManagedRole, userId: string) {
  const result = await db
    .delete(users)
    .where(and(eq(users.id, userId), eq(users.role, role)))
    .returning();

  return result[0] ?? null;
}

export async function listUserAttendance(userId: string) {
  return db
    .select()
    .from(userAttendance)
    .where(eq(userAttendance.userId, userId))
    .orderBy(desc(userAttendance.workDate));
}

export async function createUserAttendance(userId: string, input: UserAttendanceInput) {
  const result = await db
    .insert(userAttendance)
    .values({
      userId,
      workDate: input.workDate,
      status: input.status,
      notes: input.notes
    })
    .returning();

  return result[0];
}

export async function updateUserAttendance(
  userId: string,
  attendanceId: string,
  patch: Partial<UserAttendanceInput>
) {
  const result = await db
    .update(userAttendance)
    .set({
      ...patch,
      updatedAt: sql`now()`
    })
    .where(and(eq(userAttendance.id, attendanceId), eq(userAttendance.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteUserAttendance(userId: string, attendanceId: string) {
  const result = await db
    .delete(userAttendance)
    .where(and(eq(userAttendance.id, attendanceId), eq(userAttendance.userId, userId)))
    .returning();

  return result[0] ?? null;
}

export async function listStudentProgress(studentId: string) {
  return db
    .select()
    .from(studentProgress)
    .where(eq(studentProgress.studentId, studentId))
    .orderBy(desc(studentProgress.updatedAt));
}

export async function createStudentProgress(studentId: string, input: StudentProgressInput) {
  const result = await db
    .insert(studentProgress)
    .values({
      studentId,
      skillArea: input.skillArea,
      level: input.level,
      notes: input.notes
    })
    .returning();

  return result[0];
}

export async function updateStudentProgress(
  studentId: string,
  progressId: string,
  patch: Partial<StudentProgressInput>
) {
  const result = await db
    .update(studentProgress)
    .set({
      ...patch,
      updatedAt: sql`now()`
    })
    .where(and(eq(studentProgress.id, progressId), eq(studentProgress.studentId, studentId)))
    .returning();

  return result[0] ?? null;
}

export async function deleteStudentProgress(studentId: string, progressId: string) {
  const result = await db
    .delete(studentProgress)
    .where(and(eq(studentProgress.id, progressId), eq(studentProgress.studentId, studentId)))
    .returning();

  return result[0] ?? null;
}

export async function listStudentRescheduleRequests(studentId: string) {
  return db
    .select()
    .from(rescheduleRequests)
    .where(eq(rescheduleRequests.studentId, studentId))
    .orderBy(desc(rescheduleRequests.createdAt));
}

export async function getCredentialAccountByUserId(userId: string) {
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);

  return result[0] ?? null;
}

export async function createCredentialAccount(userId: string, passwordHash: string) {
  const result = await db
    .insert(accounts)
    .values({
      userId,
      accountId: userId,
      providerId: "credential",
      password: passwordHash
    })
    .returning();

  return result[0];
}

export async function updateCredentialPassword(accountId: string, passwordHash: string) {
  const result = await db
    .update(accounts)
    .set({ password: passwordHash, updatedAt: sql`now()` })
    .where(eq(accounts.id, accountId))
    .returning();

  return result[0] ?? null;
}
