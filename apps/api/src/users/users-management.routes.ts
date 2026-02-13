import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  makeCreateUserHandler,
  createStudentProgress,
  deleteStudentProgress,
  listStudentProgress,
  listStudentRescheduleRequests,
  makeCreateAttendanceHandler,
  makeDeleteAttendanceHandler,
  makeGetUserHandler,
  makeListAttendanceHandler,
  makeListUsersHandler,
  makePatchAttendanceHandler,
  makePatchUserHandler,
  patchStudentProgress,
  setStudentTemporaryPassword
} from "./users-management.controller";

export const usersManagementRouter = Router();

usersManagementRouter.use(requireAuth);

usersManagementRouter.get("/students", makeListUsersHandler("student"));
usersManagementRouter.post("/students", makeCreateUserHandler("student"));
usersManagementRouter.get("/students/:id", makeGetUserHandler("student"));
usersManagementRouter.patch("/students/:id", makePatchUserHandler("student"));
usersManagementRouter.get("/students/:id/attendance", makeListAttendanceHandler("student"));
usersManagementRouter.post("/students/:id/attendance", makeCreateAttendanceHandler("student"));
usersManagementRouter.patch(
  "/students/:id/attendance/:attendanceId",
  makePatchAttendanceHandler("student")
);
usersManagementRouter.delete(
  "/students/:id/attendance/:attendanceId",
  makeDeleteAttendanceHandler("student")
);
usersManagementRouter.get("/students/:id/progress", listStudentProgress);
usersManagementRouter.post("/students/:id/progress", createStudentProgress);
usersManagementRouter.patch("/students/:id/progress/:progressId", patchStudentProgress);
usersManagementRouter.delete("/students/:id/progress/:progressId", deleteStudentProgress);
usersManagementRouter.get("/students/:id/reschedule-requests", listStudentRescheduleRequests);
usersManagementRouter.post("/students/:id/set-temporary-password", setStudentTemporaryPassword);

usersManagementRouter.get("/teachers", makeListUsersHandler("teacher"));
usersManagementRouter.post("/teachers", makeCreateUserHandler("teacher"));
usersManagementRouter.get("/teachers/:id", makeGetUserHandler("teacher"));
usersManagementRouter.patch("/teachers/:id", makePatchUserHandler("teacher"));
usersManagementRouter.get("/teachers/:id/attendance", makeListAttendanceHandler("teacher"));
usersManagementRouter.post("/teachers/:id/attendance", makeCreateAttendanceHandler("teacher"));
usersManagementRouter.patch(
  "/teachers/:id/attendance/:attendanceId",
  makePatchAttendanceHandler("teacher")
);
usersManagementRouter.delete(
  "/teachers/:id/attendance/:attendanceId",
  makeDeleteAttendanceHandler("teacher")
);

usersManagementRouter.get("/staff", makeListUsersHandler("staff"));
usersManagementRouter.post("/staff", makeCreateUserHandler("staff"));
usersManagementRouter.get("/staff/:id", makeGetUserHandler("staff"));
usersManagementRouter.patch("/staff/:id", makePatchUserHandler("staff"));
usersManagementRouter.get("/staff/:id/attendance", makeListAttendanceHandler("staff"));
usersManagementRouter.post("/staff/:id/attendance", makeCreateAttendanceHandler("staff"));
usersManagementRouter.patch(
  "/staff/:id/attendance/:attendanceId",
  makePatchAttendanceHandler("staff")
);
usersManagementRouter.delete(
  "/staff/:id/attendance/:attendanceId",
  makeDeleteAttendanceHandler("staff")
);

usersManagementRouter.get("/admins", makeListUsersHandler("admin"));
usersManagementRouter.post("/admins", makeCreateUserHandler("admin"));
usersManagementRouter.get("/admins/:id", makeGetUserHandler("admin"));
usersManagementRouter.patch("/admins/:id", makePatchUserHandler("admin"));
usersManagementRouter.get("/admins/:id/attendance", makeListAttendanceHandler("admin"));
usersManagementRouter.post("/admins/:id/attendance", makeCreateAttendanceHandler("admin"));
usersManagementRouter.patch(
  "/admins/:id/attendance/:attendanceId",
  makePatchAttendanceHandler("admin")
);
usersManagementRouter.delete(
  "/admins/:id/attendance/:attendanceId",
  makeDeleteAttendanceHandler("admin")
);
