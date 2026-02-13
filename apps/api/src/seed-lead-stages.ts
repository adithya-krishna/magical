import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, pool } from "./db";
import { leadStages } from "./db/schema";

dotenv.config();

const STAGES = [
  { name: "Due for validation", color: "bg-sky-400", ordering: 1, isOnboarded: false },
  { name: "Call not connected", color: "bg-orange-500", ordering: 2, isOnboarded: false },
  { name: "Walkin Expected", color: "bg-yellow-500", ordering: 3, isOnboarded: false },
  { name: "Walked in", color: "bg-indigo-500", ordering: 4, isOnboarded: false },
  { name: "Converted", color: "bg-emerald-500", ordering: 5, isOnboarded: true },
  { name: "Cold", color: "bg-cyan-500", ordering: 6, isOnboarded: false },
  { name: "Hot", color: "bg-red-500", ordering: 7, isOnboarded: false },
  { name: "Prospective", color: "bg-violet-500", ordering: 8, isOnboarded: false }
] as const;

async function seedLeadStages() {
  await db.execute(
    sql`ALTER TABLE "lead_stages" ADD COLUMN IF NOT EXISTS "color" text NOT NULL DEFAULT 'bg-slate-500'`
  );

  for (const stage of STAGES) {
    const existing = await db
      .select({ id: leadStages.id })
      .from(leadStages)
      .where(eq(leadStages.name, stage.name))
      .limit(1);

    if (existing[0]) {
      await db
        .update(leadStages)
        .set({
          color: stage.color,
          ordering: stage.ordering,
          isOnboarded: stage.isOnboarded,
          isActive: true
        })
        .where(eq(leadStages.id, existing[0].id));

      console.log(`[seed:stages] Updated stage: ${stage.name}`);
      continue;
    }

    await db.insert(leadStages).values({
      name: stage.name,
      color: stage.color,
      ordering: stage.ordering,
      isOnboarded: stage.isOnboarded,
      isActive: true
    });

    console.log(`[seed:stages] Created stage: ${stage.name}`);
  }

  console.log("[seed:stages] Lead stages seed complete.");
}

seedLeadStages()
  .catch((error) => {
    console.error("[seed:stages] Failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
