import dotenv from "dotenv";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./db";
import { instruments } from "./db/schema";

dotenv.config();

const DEFAULT_INSTRUMENTS = [
  "Piano",
  "Guitar",
  "Violin",
  "Drums",
  "Keyboard",
  "Vocals"
] as const;

async function seedInstruments() {
  for (const instrumentName of DEFAULT_INSTRUMENTS) {
    const existing = await db
      .select({ id: instruments.id })
      .from(instruments)
      .where(sql`lower(${instruments.name}) = lower(${instrumentName})`)
      .limit(1);

    if (existing[0]) {
      await db
        .update(instruments)
        .set({ isActive: true, updatedAt: sql`now()` })
        .where(eq(instruments.id, existing[0].id));

      console.log(`[seed:instruments] Updated instrument: ${instrumentName}`);
      continue;
    }

    await db.insert(instruments).values({ name: instrumentName, isActive: true });
    console.log(`[seed:instruments] Created instrument: ${instrumentName}`);
  }

  console.log("[seed:instruments] Instrument seed complete.");
}

seedInstruments()
  .catch((error) => {
    console.error("[seed:instruments] Failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
