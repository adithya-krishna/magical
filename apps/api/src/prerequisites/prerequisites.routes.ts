import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getPrerequisites, updatePrerequisites } from "./prerequisites.controller";

export const prerequisitesRouter = Router();

prerequisitesRouter.use(requireAuth);

prerequisitesRouter.get("/", requireRole(["super_admin", "admin", "staff"]), getPrerequisites);
prerequisitesRouter.patch("/", requireRole(["super_admin"]), updatePrerequisites);
