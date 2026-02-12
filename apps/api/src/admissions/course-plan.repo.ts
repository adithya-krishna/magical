import { eq } from "drizzle-orm";
import { db } from "../db";
import { coursePlans } from "../db/schema";

export async function listCoursePlans(isActive?: boolean) {
  const where = isActive === undefined ? undefined : eq(coursePlans.isActive, isActive);
  if (!where) {
    return db.select().from(coursePlans);
  }

  return db.select().from(coursePlans).where(where);
}

export async function getCoursePlanById(id: string) {
  const result = await db
    .select()
    .from(coursePlans)
    .where(eq(coursePlans.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createCoursePlan(input: typeof coursePlans.$inferInsert) {
  const result = await db.insert(coursePlans).values(input).returning();
  return result[0];
}

export async function updateCoursePlan(id: string, patch: Partial<typeof coursePlans.$inferInsert>) {
  const result = await db
    .update(coursePlans)
    .set(patch)
    .where(eq(coursePlans.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteCoursePlan(id: string) {
  const result = await db.delete(coursePlans).where(eq(coursePlans.id, id)).returning();
  return result[0] ?? null;
}
