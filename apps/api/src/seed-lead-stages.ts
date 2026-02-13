import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";
import { leadStages } from "./db/schema";

dotenv.config();

const STAGES = [
  { name: "Due for validation", ordering: 1, isOnboarded: false },
  { name: "Call not connected", ordering: 2, isOnboarded: false },
  { name: "Walkin Expected", ordering: 3, isOnboarded: false },
  { name: "Walked in", ordering: 4, isOnboarded: false },
  { name: "Converted", ordering: 5, isOnboarded: true },
  { name: "Cold", ordering: 6, isOnboarded: false },
  { name: "Hot", ordering: 7, isOnboarded: false },
  { name: "Prospective", ordering: 8, isOnboarded: false }
] as const;

async function seedLeadStages() {
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
