import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createCourse,
  deleteCourse,
  deleteCourseTeacher,
  getCourse,
  getCourseTeachers,
  listCourses,
  patchCourse,
  postCourseTeacher
} from "./courses.controller";

export const coursesRouter = Router();

coursesRouter.use(requireAuth);

coursesRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listCourses);
coursesRouter.post("/", requireRole(["super_admin", "admin"]), createCourse);
coursesRouter.get("/:id", requireRole(["super_admin", "admin", "staff"]), getCourse);
coursesRouter.patch("/:id", requireRole(["super_admin", "admin"]), patchCourse);
coursesRouter.delete("/:id", requireRole(["super_admin", "admin"]), deleteCourse);

coursesRouter.get(
  "/:id/teachers",
  requireRole(["super_admin", "admin", "staff"]),
  getCourseTeachers
);
coursesRouter.post(
  "/:id/teachers",
  requireRole(["super_admin", "admin"]),
  postCourseTeacher
);
coursesRouter.delete(
  "/:id/teachers/:teacherId",
  requireRole(["super_admin", "admin"]),
  deleteCourseTeacher
);
