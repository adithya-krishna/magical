import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db, pool } from "./db";
import { accounts, users } from "./db/schema";

dotenv.config();

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const firstName = process.env.SUPER_ADMIN_FIRST_NAME;
const lastName = process.env.SUPER_ADMIN_LAST_NAME;

if (!email || !password || !firstName || !lastName) {
  throw new Error(
    "Missing SUPER_ADMIN_* env vars. Ensure email, password, first and last name are set."
  );
}

const superAdmin = {
  email: email as string,
  password: password as string,
  firstName: firstName as string,
  lastName: lastName as string
};

async function seedSuperAdmin() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, superAdmin.email))
    .limit(1);

  if (existing.length > 0) {
    console.log("[seed] Super admin already exists.");
    return;
  }

  const passwordHash = await hashPassword(superAdmin.password);
  const fullName = `${superAdmin.firstName} ${superAdmin.lastName}`.trim();

  const [createdUser] = await db
    .insert(users)
    .values({
      email: superAdmin.email.toLowerCase(),
      name: fullName,
      role: "super_admin",
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      isActive: true,
      emailVerified: true
    })
    .returning();

  if (!createdUser) {
    throw new Error("Failed to create super admin user");
  }

  await db.insert(accounts).values({
    id: randomUUID(),
    userId: createdUser.id,
    accountId: createdUser.id,
    providerId: "credential",
    password: passwordHash
  });

  console.log("[seed] Super admin created.");
}

seedSuperAdmin()
  .catch((error) => {
    console.error("[seed] Failed to create super admin.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
