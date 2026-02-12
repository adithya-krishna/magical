import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  attendanceListSchema,
  attendanceUpdateSchema,
  attendanceUpsertSchema,
  classroomAssignmentSchema,
  classroomSlotCreateSchema,
  classroomSlotListSchema,
  classroomSlotUpdateSchema,
  dashboardSchema,
  operatingDayUpdateSchema,
  rescheduleCreateSchema,
  rescheduleListSchema,
  rescheduleUpdateSchema,
  studentFilterSchema,
  timeSlotCreateSchema,
  timeSlotListSchema,
  timeSlotUpdateSchema
} from "./classroom.schemas";
import {
  createClassroomAssignmentService,
  createClassroomSlotService,
  createRescheduleRequestService,
  createTimeSlotService,
  deleteClassroomSlotService,
  deleteTimeSlotService,
  getClassroomDashboardService,
  listAttendanceService,
  listClassroomSlotsService,
  listOperatingDaysService,
  listRescheduleRequestsService,
  listStudentsService,
  listTimeSlotsService,
  updateAttendanceService,
  updateClassroomSlotService,
  updateOperatingDaysService,
  updateRescheduleRequestService,
  updateTimeSlotService,
  upsertAttendanceService
} from "./classroom.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listOperatingDays(req: Request, res: Response) {
  try {
    const data = await listOperatingDaysService();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateOperatingDays(req: Request, res: Response) {
  const parsed = operatingDayUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await updateOperatingDaysService(parsed.data, req.user);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listTimeSlots(req: Request, res: Response) {
  const parsed = timeSlotListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listTimeSlotsService(parsed.data.day);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createTimeSlot(req: Request, res: Response) {
  const parsed = timeSlotCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await createTimeSlotService(parsed.data, req.user);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateTimeSlot(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = timeSlotUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await updateTimeSlotService(params.data.id, parsed.data, req.user);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteTimeSlot(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await deleteTimeSlotService(params.data.id, req.user);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function listClassroomSlots(req: Request, res: Response) {
  const parsed = classroomSlotListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listClassroomSlotsService(parsed.data);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createClassroomSlot(req: Request, res: Response) {
  const parsed = classroomSlotCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await createClassroomSlotService(parsed.data, req.user);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateClassroomSlot(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = classroomSlotUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await updateClassroomSlotService(params.data.id, parsed.data, req.user);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteClassroomSlot(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await deleteClassroomSlotService(params.data.id, req.user);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function getClassroomDashboard(req: Request, res: Response) {
  const parsed = dashboardSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await getClassroomDashboardService(parsed.data.day);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listAttendance(req: Request, res: Response) {
  const params = z.object({ slotId: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = attendanceListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listAttendanceService(params.data.slotId, parsed.data.date);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function upsertAttendance(req: Request, res: Response) {
  const params = z.object({ slotId: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = attendanceUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await upsertAttendanceService(params.data.slotId, parsed.data, req.user);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateAttendance(req: Request, res: Response) {
  const params = z
    .object({ slotId: z.string().uuid(), attendanceId: z.string().uuid() })
    .safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = attendanceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await updateAttendanceService(
      params.data.slotId,
      params.data.attendanceId,
      parsed.data,
      req.user
    );
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createRescheduleRequest(req: Request, res: Response) {
  const parsed = rescheduleCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await createRescheduleRequestService(parsed.data, req.user);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listRescheduleRequests(req: Request, res: Response) {
  const parsed = rescheduleListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listRescheduleRequestsService(parsed.data.status);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateRescheduleRequest(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = rescheduleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await updateRescheduleRequestService(params.data.id, parsed.data, req.user);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listStudents(req: Request, res: Response) {
  const parsed = studentFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listStudentsService(parsed.data.courseId, parsed.data.teacherId);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createClassroomAssignment(req: Request, res: Response) {
  const parsed = classroomAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = await createClassroomAssignmentService(parsed.data, req.user);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}
