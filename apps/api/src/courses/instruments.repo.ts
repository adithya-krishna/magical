import { and, asc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { instruments } from "../db/schema";
import type {
  InstrumentCreateInput,
  InstrumentFilters,
  InstrumentUpdateInput
} from "./courses.types";

export async function listInstruments(filters: InstrumentFilters) {
  const whereClauses = [] as SQL[];

  if (typeof filters.isActive === "boolean") {
    whereClauses.push(eq(instruments.isActive, filters.isActive));
  }

  if (filters.search) {
    whereClauses.push(ilike(instruments.name, `%${filters.search}%`));
  }

  const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  return db
    .select()
    .from(instruments)
    .where(where)
    .orderBy(asc(instruments.name));
}

export async function getInstrumentById(id: string) {
  const result = await db
    .select()
    .from(instruments)
    .where(eq(instruments.id, id))
    .limit(1);

  return result[0] ?? null;
}

export async function getInstrumentByName(name: string) {
  const result = await db
    .select()
    .from(instruments)
    .where(sql`lower(${instruments.name}) = lower(${name})`)
    .limit(1);

  return result[0] ?? null;
}

export async function createInstrument(input: InstrumentCreateInput) {
  const result = await db
    .insert(instruments)
    .values({
      name: input.name,
      isActive: input.isActive ?? true
    })
    .returning();

  return result[0];
}

export async function updateInstrument(id: string, patch: InstrumentUpdateInput) {
  const result = await db
    .update(instruments)
    .set({
      ...patch,
      updatedAt: sql`now()`
    })
    .where(eq(instruments.id, id))
    .returning();

  return result[0] ?? null;
}

export async function archiveInstrument(id: string) {
  const result = await db
    .update(instruments)
    .set({
      isActive: false,
      updatedAt: sql`now()`
    })
    .where(eq(instruments.id, id))
    .returning();

  return result[0] ?? null;
}
