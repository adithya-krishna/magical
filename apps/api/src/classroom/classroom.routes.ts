import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createClassroomAssignment,
  createClassroomSlot,
  createRescheduleRequest,
  createTimeSlot,
  deleteClassroomSlot,
  deleteTimeSlot,
  getClassroomDashboard,
  listAttendance,
  listClassroomSlots,
  listOperatingDays,
  listRescheduleRequests,
  listStudents,
  listTimeSlots,
  updateAttendance,
  updateClassroomSlot,
  updateOperatingDays,
  updateRescheduleRequest,
  updateTimeSlot,
  upsertAttendance
} from "./classroom.controller";

export const classroomRouter = Router();

classroomRouter.use(requireAuth);

classroomRouter.get(
  "/operating-days",
  requireRole(["super_admin", "admin", "staff"]),
  listOperatingDays
);
classroomRouter.patch(
  "/operating-days",
  requireRole(["super_admin", "admin"]),
  updateOperatingDays
);

classroomRouter.get(
  "/time-slots",
  requireRole(["super_admin", "admin", "staff"]),
  listTimeSlots
);
classroomRouter.post(
  "/time-slots",
  requireRole(["super_admin", "admin"]),
  createTimeSlot
);
classroomRouter.patch(
  "/time-slots/:id",
  requireRole(["super_admin", "admin"]),
  updateTimeSlot
);
classroomRouter.delete(
  "/time-slots/:id",
  requireRole(["super_admin", "admin"]),
  deleteTimeSlot
);

classroomRouter.get(
  "/classroom-slots",
  requireRole(["super_admin", "admin", "staff"]),
  listClassroomSlots
);
classroomRouter.post(
  "/classroom-slots",
  requireRole(["super_admin", "admin"]),
  createClassroomSlot
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
