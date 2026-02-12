import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createAdmission,
  deleteAdmission,
  getAdmission,
  listAdmissions,
  updateAdmission
} from "./admission.controller";

export const admissionsRouter = Router();

admissionsRouter.use(requireAuth);

admissionsRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listAdmissions);
admissionsRouter.post("/", requireRole(["super_admin", "admin", "staff"]), createAdmission);
admissionsRouter.get(
  "/:id",
  requireRole(["super_admin", "admin", "staff"]),
  getAdmission
);
admissionsRouter.patch(
  "/:id",
  requireRole(["super_admin", "admin", "staff"]),
  updateAdmission
);
admissionsRouter.delete(
  "/:id",
  requireRole(["super_admin", "admin", "staff"]),
  deleteAdmission
);
