import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createClassroomAssignment,
  createBulkClassroomSlots,
  createClassroomSlot,
  createRescheduleRequest,
  deleteClassroomSlot,
  getClassroomSlot,
  getClassroomDashboard,
  listAttendance,
  listClassroomSlots,
  listRescheduleRequests,
  listStudents,
  updateAttendance,
  updateClassroomSlot,
  updateRescheduleRequest,
  upsertAttendance
} from "./classroom.controller";

export const classroomRouter = Router();

classroomRouter.use(requireAuth);

classroomRouter.get(
  "/classroom-slots",
  requireRole(["super_admin", "admin", "staff"]),
  listClassroomSlots
);
classroomRouter.get(
  "/classroom-slots/:id",
  requireRole(["super_admin", "admin", "staff"]),
  getClassroomSlot
);
classroomRouter.post(
  "/classroom-slots",
  requireRole(["super_admin", "admin"]),
  createClassroomSlot
);
classroomRouter.post(
  "/classroom-slots/bulk",
  requireRole(["super_admin", "admin"]),
  createBulkClassroomSlots
);
classroomRouter.patch(
  "/classroom-slots/:id",
  requireRole(["super_admin", "admin"]),
  updateClassroomSlot
);
classroomRouter.delete(
  "/classroom-slots/:id",
  requireRole(["super_admin", "admin"]),
  deleteClassroomSlot
);

classroomRouter.get(
  "/classroom-dashboard",
  requireRole(["super_admin", "admin", "staff"]),
  getClassroomDashboard
);

classroomRouter.get(
  "/classrooms/:slotId/attendance",
  requireRole(["super_admin", "admin", "staff"]),
  listAttendance
);
classroomRouter.post(
  "/classrooms/:slotId/attendance",
  requireRole(["super_admin", "admin"]),
  upsertAttendance
);
classroomRouter.patch(
  "/classrooms/:slotId/attendance/:attendanceId",
  requireRole(["super_admin", "admin"]),
  updateAttendance
);

classroomRouter.post(
  "/reschedule-requests",
  requireRole(["student"]),
  createRescheduleRequest
);
classroomRouter.get(
  "/reschedule-requests",
  requireRole(["super_admin", "admin", "staff"]),
  listRescheduleRequests
);
classroomRouter.patch(
  "/reschedule-requests/:id",
  requireRole(["super_admin", "admin"]),
  updateRescheduleRequest
);

classroomRouter.get(
  "/students",
  requireRole(["super_admin", "admin", "staff"]),
  listStudents
);
classroomRouter.post(
  "/classroom-assignments",
  requireRole(["super_admin", "admin"]),
  createClassroomAssignment
);
