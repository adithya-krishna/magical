import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type UserRole = "super_admin" | "admin" | "staff" | "teacher" | "student";

export async function listUsersByRoles(roles: UserRole[]) {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(and(isNull(users.deletedAt), inArray(users.role, roles)));
}

export async function listActiveUsersByRoles(roles: UserRole[]) {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        eq(users.isActive, true),
        eq(users.banned, false),
        inArray(users.role, roles)
      )
    );
}

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}
