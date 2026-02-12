import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config";

if (!config.databaseUrl) {
  console.warn("[db] DATABASE_URL is not set. Database calls will fail.");
}

export const pool = new Pool({
  connectionString: config.databaseUrl
});

export const db = drizzle(pool);
