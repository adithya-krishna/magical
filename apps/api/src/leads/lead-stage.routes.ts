import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createLeadStage,
  deleteLeadStage,
  listLeadStages,
  updateLeadStage
} from "./lead-stage.controller";

export const leadStagesRouter = Router();

leadStagesRouter.use(requireAuth);

leadStagesRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listLeadStages);
leadStagesRouter.post("/", requireRole(["super_admin", "admin"]), createLeadStage);
leadStagesRouter.patch("/:id", requireRole(["super_admin", "admin"]), updateLeadStage);
leadStagesRouter.delete("/:id", requireRole(["super_admin", "admin"]), deleteLeadStage);
