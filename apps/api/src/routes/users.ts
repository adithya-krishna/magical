import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { type UserRole, listUsersByRoles } from "../users/user.repo";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/",
  requireRole(["super_admin", "admin", "staff"]),
  async (req, res) => {
    const query = z
      .object({ roles: z.string().optional() })
      .safeParse(req.query);

    if (!query.success) {
      res.status(400).json({ error: query.error.flatten() });
      return;
    }

    const roles = (query.data.roles
      ?.split(",")
      .map((role) => role.trim()) ?? []) as UserRole[];
    const data = roles.length > 0 ? await listUsersByRoles(roles) : [];
    res.json({ data });
  }
);

usersRouter.get("/me", (req, res) => {
  res.json({ data: req.user || null });
});
