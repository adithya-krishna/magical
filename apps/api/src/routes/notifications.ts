import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", (req, res) => {
  const query = z
    .object({ status: z.string().optional(), limit: z.coerce.number().optional() })
    .safeParse(req.query);

  if (!query.success) {
    res.status(400).json({ error: query.error.flatten() });
    return;
  }

  res.json({ data: [], total: 0, query: query.data });
});

notificationsRouter.get("/unread-count", (_req, res) => {
  res.json({ count: 0 });
});

notificationsRouter.patch("/:id", (req, res) => {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  res.json({ data: { id: params.data.id } });
});
