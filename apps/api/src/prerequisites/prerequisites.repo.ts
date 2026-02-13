import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { operatingDays, timeSlotTemplates } from "../db/schema";

export async function listPrerequisites() {
  const [days, slots] = await Promise.all([
    db.select().from(operatingDays).orderBy(operatingDays.dayOfWeek),
    db
      .select()
      .from(timeSlotTemplates)
      .where(eq(timeSlotTemplates.isActive, true))
      .orderBy(timeSlotTemplates.dayOfWeek, timeSlotTemplates.startTime)
  ]);

  return { days, slots };
}

export async function updateOperatingDaysState(days: Array<{ dayOfWeek: number; isOpen: boolean }>) {
  return db.transaction(async (tx) => {
    for (const day of days) {
      await tx
        .insert(operatingDays)
        .values({
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen
        })
        .onConflictDoUpdate({
          target: operatingDays.dayOfWeek,
          set: {
            isOpen: day.isOpen
          }
        });
    }
  });
}

export async function findActiveTimeSlot(dayOfWeek: number, startTime: string, endTime: string) {
  const rows = await db
    .select()
    .from(timeSlotTemplates)
    .where(
      and(
        eq(timeSlotTemplates.dayOfWeek, dayOfWeek),
        eq(timeSlotTemplates.startTime, startTime),
        eq(timeSlotTemplates.endTime, endTime),
        eq(timeSlotTemplates.isActive, true)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function deactivateTimeSlotsForDay(dayOfWeek: number) {
  await db
    .update(timeSlotTemplates)
    .set({ isActive: false })
    .where(and(eq(timeSlotTemplates.dayOfWeek, dayOfWeek), eq(timeSlotTemplates.isActive, true)));
}

export async function upsertOperationalTimeSlot(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}) {
  const existing = await db
    .select()
    .from(timeSlotTemplates)
    .where(
      and(
        eq(timeSlotTemplates.dayOfWeek, input.dayOfWeek),
        eq(timeSlotTemplates.startTime, input.startTime),
        eq(timeSlotTemplates.endTime, input.endTime)
      )
    )
    .limit(1);

  if (existing[0]) {
    const updated = await db
      .update(timeSlotTemplates)
      .set({
        durationMinutes: input.durationMinutes,
        isActive: true
      })
      .where(eq(timeSlotTemplates.id, existing[0].id))
      .returning();

    return updated[0] ?? null;
  }

  return createOperationalTimeSlot(input);
}

export async function createOperationalTimeSlot(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}) {
  const rows = await db
    .insert(timeSlotTemplates)
    .values({
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      isActive: true
    })
    .returning();

  return rows[0] ?? null;
}

export async function listDayTimeWindow() {
  return db
    .select({
      dayOfWeek: timeSlotTemplates.dayOfWeek,
      startTime: sql<string>`min(${timeSlotTemplates.startTime})`,
      endTime: sql<string>`max(${timeSlotTemplates.endTime})`
    })
    .from(timeSlotTemplates)
    .where(eq(timeSlotTemplates.isActive, true))
    .groupBy(timeSlotTemplates.dayOfWeek)
    .orderBy(timeSlotTemplates.dayOfWeek);
}
