import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createCoursePlan,
  deleteCoursePlan,
  getCoursePlan,
  listCoursePlans,
  updateCoursePlan
} from "./course-plan.controller";

export const coursePlansRouter = Router();

coursePlansRouter.use(requireAuth);

coursePlansRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listCoursePlans);
coursePlansRouter.get("/:id", requireRole(["super_admin", "admin", "staff"]), getCoursePlan);
coursePlansRouter.post("/", requireRole(["super_admin", "admin"]), createCoursePlan);
coursePlansRouter.patch(
  "/:id",
  requireRole(["super_admin", "admin"]),
  updateCoursePlan
);
coursePlansRouter.delete(
  "/:id",
  requireRole(["super_admin", "admin"]),
  deleteCoursePlan
);
