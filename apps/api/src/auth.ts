import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "./config";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications
    }
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false
  },
  user: {
    modelName: "users",
    fields: {
      name: "name",
      email: "email",
      emailVerified: "email_verified",
      image: "image"
    },
    additionalFields: {
      role: {
        type: ["super_admin", "admin", "staff", "teacher", "student"],
        required: true,
        defaultValue: "staff",
        input: true
      },
      firstName: {
        type: "string",
        required: true,
        input: true
      },
      lastName: {
        type: "string",
        required: true,
        input: true
      },
      phone: {
        type: "string",
        required: false
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (data) => {
          const rawName = data.name?.trim() ?? "";
          const nameParts = rawName.split(" ").filter(Boolean);
          const firstName = data.firstName ?? nameParts[0] ?? "User";
          const lastName =
            data.lastName ?? (nameParts.slice(1).join(" ") || "User");

          return {
            data: {
              ...data,
              firstName,
              lastName
            }
          };
        }
      }
    }
  }
});
