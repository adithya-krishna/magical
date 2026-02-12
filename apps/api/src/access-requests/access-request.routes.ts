import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../db";
import { accessRequests } from "../db/schema";
import { requireAuth, requireRole } from "../middleware/auth";

export const accessRequestsRouter = Router();

const requestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roleRequested: z.enum(["admin", "staff", "teacher", "student"])
});

accessRequestsRouter.post("/", async (req, res) => {
  const body = requestSchema.safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  const result = await db
    .insert(accessRequests)
    .values({
      email: body.data.email,
      firstName: body.data.firstName,
      lastName: body.data.lastName,
      phone: body.data.phone,
      roleRequested: body.data.roleRequested,
      status: "pending"
    })
    .returning();

  res.status(201).json({ data: result[0] });
});

accessRequestsRouter.get(
  "/",
  requireAuth,
  requireRole(["super_admin", "admin"]),
  async (_req, res) => {
    const data = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.status, "pending"));
    res.json({ data });
  }
);

accessRequestsRouter.patch(
  "/:id/approve",
  requireAuth,
  requireRole(["super_admin"]),
  async (req, res) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    const body = z
      .object({ password: z.string().min(8) })
      .safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: {
          params: params.success ? undefined : params.error.flatten(),
          body: body.success ? undefined : body.error.flatten()
        }
      });
      return;
    }

    const request = await db
      .select()
      .from(accessRequests)
      .where(and(eq(accessRequests.id, params.data.id)))
      .limit(1);

    const requestData = request[0];

    if (!requestData) {
      res.status(404).json({ error: "Access request not found" });
      return;
    }

    if (requestData.status !== "pending") {
      res.status(409).json({ error: "Access request already resolved" });
      return;
    }

    let createdUser;

    try {
      createdUser = await auth.api.signUpEmail({
        body: {
          email: requestData.email,
          password: body.data.password,
          name: `${requestData.firstName} ${requestData.lastName}`.trim(),
          role: requestData.roleRequested,
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          phone: requestData.phone,
          isActive: true
        }
      });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Unable to create user account"
      });
      return;
    }

    const update = await db
      .update(accessRequests)
      .set({
        status: "approved",
        reviewedBy: req.user?.id,
        reviewedAt: new Date(),
        userId: createdUser.user.id
      })
      .where(eq(accessRequests.id, params.data.id))
      .returning();

    res.json({ data: update[0] });
  }
);

accessRequestsRouter.patch(
  "/:id/reject",
  requireAuth,
  requireRole(["super_admin"]),
  async (req, res) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!params.success) {
      res.status(400).json({ error: params.error.flatten() });
      return;
    }

    const existing = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, params.data.id))
      .limit(1);

    const requestData = existing[0];

    if (!requestData) {
      res.status(404).json({ error: "Access request not found" });
      return;
    }

    if (requestData.status !== "pending") {
      res.status(409).json({ error: "Access request already resolved" });
      return;
    }

    const update = await db
      .update(accessRequests)
      .set({
        status: "rejected",
        reviewedBy: req.user?.id,
        reviewedAt: new Date()
      })
      .where(eq(accessRequests.id, params.data.id))
      .returning();

    res.json({ data: update[0] });
  }
);
