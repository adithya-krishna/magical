import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";

export const coursesRouter = Router();

coursesRouter.use(requireAuth);

coursesRouter.get(
  "/",
  requireRole(["super_admin", "admin", "staff"]),
  (_req, res) => {
    res.json({ data: [], total: 0 });
  }
);

coursesRouter.post(
  "/",
  requireRole(["super_admin", "admin"]),
  (req, res) => {
    const body = z
      .object({
        name: z.string().min(1),
        instrumentId: z.string().uuid(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"])
      })
      .safeParse(req.body);

    if (!body.success) {
      res.status(400).json({ error: body.error.flatten() });
      return;
    }

    res.status(201).json({ data: { id: "course_new", ...body.data } });
  }
);

coursesRouter.get(
  "/:id",
  requireRole(["super_admin", "admin", "staff"]),
  (req, res) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.flatten() });
      return;
    }

    res.json({ data: { id: params.data.id } });
  }
);

coursesRouter.get(
  "/:id/teachers",
  requireRole(["super_admin", "admin", "staff"]),
  (_req, res) => {
    res.json({ data: [] });
  }
);
