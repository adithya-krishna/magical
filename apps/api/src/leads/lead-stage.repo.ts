import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { leadStages } from "../db/schema";
import type { LeadStageColor } from "./lead-stage-colors";

export async function listLeadStages() {
  return db.select().from(leadStages).orderBy(asc(leadStages.ordering));
}

export async function createLeadStage(input: {
  name: string;
  color: LeadStageColor;
  ordering: number;
  isOnboarded?: boolean;
  isActive?: boolean;
}) {
  const result = await db
    .insert(leadStages)
    .values({
      name: input.name,
      color: input.color,
      ordering: input.ordering,
      isOnboarded: input.isOnboarded ?? false,
      isActive: input.isActive ?? true
    })
    .returning();

  return result[0];
}

export async function updateLeadStage(
  id: string,
  patch: Partial<{
    name: string;
    color: LeadStageColor;
    ordering: number;
    isOnboarded: boolean;
    isActive: boolean;
  }>
) {
  const result = await db
    .update(leadStages)
    .set({
      ...patch
    })
    .where(eq(leadStages.id, id))
    .returning();

  return result[0] ?? null;
}

export async function deleteLeadStage(id: string) {
  const result = await db
    .delete(leadStages)
    .where(eq(leadStages.id, id))
    .returning();

  return result[0] ?? null;
}

export async function countActiveStages() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(leadStages)
    .where(eq(leadStages.isActive, true));
  return Number(result[0]?.count ?? 0);
}

export async function getMaxLeadStageOrdering() {
  const result = await db
    .select({ maxOrdering: sql<number>`coalesce(max(${leadStages.ordering}), 0)` })
    .from(leadStages)
    .limit(1);

  return Number(result[0]?.maxOrdering ?? 0);
}

export async function getNewLeadStage() {
  const result = await db
    .select()
    .from(leadStages)
    .where(and(eq(leadStages.name, "New"), eq(leadStages.isActive, true)))
    .limit(1);
  return result[0] ?? null;
}

export async function getActiveLeadStageByName(name: string) {
  const result = await db
    .select()
    .from(leadStages)
    .where(and(eq(leadStages.name, name), eq(leadStages.isActive, true)))
    .limit(1);

  return result[0] ?? null;
}
