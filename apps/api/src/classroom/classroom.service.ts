import { AppError } from "../common/errors";
import type { AuthUser } from "../middleware/auth";
import {
  countActiveEnrollments,
  createClassroomSlot,
  createEnrollment,
  createRescheduleRequest,
  createTimeSlot,
  deactivateClassroomSlot,
  deactivateTimeSlot,
  existsClassroomSlotForCourseTeacher,
  getAdmissionForStudentCourse,
  getAttendanceById,
  getAttendanceBySlotStudentDate,
  getClassroomSlotById,
  getClassroomSlotByTimeSlotAndCourse,
  getClassroomSlotWithCourseTeacher,
  getCourseById,
  getEnrollmentByStudentAndSlot,
  getRescheduleRequestById,
  getTimeSlotById,
  getUserById,
  insertAttendanceRows,
  listAttendanceBySlot,
  listClassroomSlots,
  listOperatingDays,
  listRescheduleRequests,
  listStudentsByCourse,
  listTimeSlots,
  updateAttendanceById,
  updateClassroomSlot,
  updateOperatingDays,
  updateRescheduleRequest,
  updateTimeSlot
} from "./classroom.repo";
import type {
  AttendanceUpdateInput,
  AttendanceUpsertInput,
  ClassroomAssignmentInput,
  ClassroomSlotCreateInput,
  ClassroomSlotFilters,
  ClassroomSlotUpdateInput,
  OperatingDayUpdate,
  RescheduleRequestCreateInput,
  RescheduleRequestUpdateInput,
  TimeSlotCreateInput,
  TimeSlotUpdateInput
} from "./classroom.types";

function parseDateOnly(value: string, fieldLabel: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${fieldLabel}`);
  }
  return date;
}

function ensureAdminAccess(user: AuthUser) {
  if (user.role === "staff") {
    throw new AppError(403, "Staff has view-only access to classroom management");
  }
}

export async function listOperatingDaysService() {
  return listOperatingDays();
}

export async function updateOperatingDaysService(updates: OperatingDayUpdate[], user: AuthUser) {
  ensureAdminAccess(user);
  return updateOperatingDays(updates);
}

export async function listTimeSlotsService(day?: number) {
  return listTimeSlots(day);
}

export async function createTimeSlotService(input: TimeSlotCreateInput, user: AuthUser) {
  ensureAdminAccess(user);

  if (input.startTime >= input.endTime) {
    throw new AppError(400, "startTime must be earlier than endTime");
  }

  return createTimeSlot({
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    durationMinutes: input.durationMinutes,
    isActive: input.isActive ?? true
  });
}

export async function updateTimeSlotService(id: string, patch: TimeSlotUpdateInput, user: AuthUser) {
  ensureAdminAccess(user);

  const existing = await getTimeSlotById(id);
  if (!existing) {
    throw new AppError(404, "Time slot not found");
  }

  const startTime = patch.startTime ?? existing.startTime;
  const endTime = patch.endTime ?? existing.endTime;
  if (startTime >= endTime) {
    throw new AppError(400, "startTime must be earlier than endTime");
  }

  const updated = await updateTimeSlot(id, {
    ...patch,
    startTime,
    endTime
  });

  if (!updated) {
    throw new AppError(404, "Time slot not found");
  }
  return updated;
}

export async function deleteTimeSlotService(id: string, user: AuthUser) {
  ensureAdminAccess(user);
  const deleted = await deactivateTimeSlot(id);
  if (!deleted) {
    throw new AppError(404, "Time slot not found");
  }
  return deleted;
}

export async function listClassroomSlotsService(filters: ClassroomSlotFilters) {
  const rows = await listClassroomSlots(filters);
  const slotIds = rows.map((row) => row.slot.id);
  const counts = await countActiveEnrollments(slotIds);
  const countMap = new Map(counts.map((row) => [row.classroomSlotId, row.count]));

  return rows.map((row) => ({
    ...row.slot,
    timeSlot: row.timeSlot,
    course: row.course,
    teacher: row.teacher,
    occupancy: countMap.get(row.slot.id) ?? 0
  }));
}

export async function createClassroomSlotService(
  input: ClassroomSlotCreateInput,
  user: AuthUser
) {
  ensureAdminAccess(user);

  const timeSlot = await getTimeSlotById(input.timeSlotId);
  if (!timeSlot || !timeSlot.isActive) {
    throw new AppError(400, "Time slot is missing or inactive");
  }

  const course = await getCourseById(input.courseId);
  if (!course) {
    throw new AppError(400, "Course not found");
  }

  const teacher = await getUserById(input.teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new AppError(400, "Teacher not found");
  }

  const existing = await getClassroomSlotByTimeSlotAndCourse(input.timeSlotId, input.courseId);
  if (existing) {
    throw new AppError(409, "Classroom slot already exists for this course and time slot");
  }

  return createClassroomSlot({
    timeSlotId: input.timeSlotId,
    courseId: input.courseId,
    teacherId: input.teacherId,
    capacity: input.capacity,
    isActive: input.isActive ?? true
  });
}

export async function updateClassroomSlotService(
  id: string,
  patch: ClassroomSlotUpdateInput,
  user: AuthUser
) {
  ensureAdminAccess(user);

  const existing = await getClassroomSlotById(id);
  if (!existing) {
    throw new AppError(404, "Classroom slot not found");
  }

  if (patch.timeSlotId) {
    const timeSlot = await getTimeSlotById(patch.timeSlotId);
    if (!timeSlot || !timeSlot.isActive) {
      throw new AppError(400, "Time slot is missing or inactive");
    }
  }

  if (patch.courseId) {
    const course = await getCourseById(patch.courseId);
    if (!course) {
      throw new AppError(400, "Course not found");
    }
  }

  if (patch.teacherId) {
    const teacher = await getUserById(patch.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new AppError(400, "Teacher not found");
    }
  }

  const updated = await updateClassroomSlot(id, patch);
  if (!updated) {
    throw new AppError(404, "Classroom slot not found");
  }
  return updated;
}

export async function deleteClassroomSlotService(id: string, user: AuthUser) {
  ensureAdminAccess(user);
  const deleted = await deactivateClassroomSlot(id);
  if (!deleted) {
    throw new AppError(404, "Classroom slot not found");
  }
  return deleted;
}

export async function getClassroomDashboardService(day?: number) {
  const rows = await listClassroomSlots({ day });
  const slotIds = rows.map((row) => row.slot.id);
  const counts = await countActiveEnrollments(slotIds);
  const countMap = new Map(counts.map((row) => [row.classroomSlotId, row.count]));

  const grouped = new Map<string, { timeSlot: typeof rows[number]["timeSlot"]; slots: Array<any> }>();

  for (const row of rows) {
    if (!row.timeSlot) {
      continue;
    }
    const key = row.timeSlot.id;
    if (!grouped.has(key)) {
      grouped.set(key, { timeSlot: row.timeSlot, slots: [] });
    }
    grouped.get(key)!.slots.push({
      ...row.slot,
      course: row.course,
      teacher: row.teacher,
      occupancy: countMap.get(row.slot.id) ?? 0
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.timeSlot || !b.timeSlot) {
      return 0;
    }
    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
  });
}

export async function listAttendanceService(slotId: string, date: string | undefined) {
  if (date) {
    parseDateOnly(date, "date");
  }
  return listAttendanceBySlot(slotId, date);
}

export async function upsertAttendanceService(
  slotId: string,
  input: AttendanceUpsertInput[] | AttendanceUpsertInput,
  user: AuthUser
) {
  const payload = Array.isArray(input) ? input : [input];
  const results = [] as Array<Awaited<ReturnType<typeof getAttendanceById>>>;

  for (const item of payload) {
    const classDate = item.classDate ?? new Date().toISOString().slice(0, 10);
    parseDateOnly(classDate, "classDate");

    let record = item.attendanceId
      ? await getAttendanceById(item.attendanceId)
      : await getAttendanceBySlotStudentDate(slotId, item.studentId, classDate);

    if (record) {
      const updated = await updateAttendanceById(record.id, {
        status: item.status,
        updatedBy: user.id,
        updatedAt: new Date()
      });
      if (updated) {
        results.push(updated);
      }
      continue;
    }

    const inserted = await insertAttendanceRows([
      {
        studentId: item.studentId,
        classroomSlotId: slotId,
        classDate,
        status: item.status,
        updatedBy: user.id,
        updatedAt: new Date()
      }
    ]);
    if (inserted[0]) {
      results.push(inserted[0]);
    }
  }

  return results;
}

export async function updateAttendanceService(
  slotId: string,
  attendanceId: string,
  patch: AttendanceUpdateInput,
  user: AuthUser
) {
  const existing = await getAttendanceById(attendanceId);
  if (!existing || existing.classroomSlotId !== slotId) {
    throw new AppError(404, "Attendance record not found");
  }

  const updated = await updateAttendanceById(attendanceId, {
    status: patch.status,
    updatedBy: user.id,
    updatedAt: new Date()
  });

  if (!updated) {
    throw new AppError(404, "Attendance record not found");
  }

  return updated;
}

export async function createRescheduleRequestService(
  input: RescheduleRequestCreateInput,
  user: AuthUser
) {
  const attendanceRecord = await getAttendanceById(input.attendanceId);
  if (!attendanceRecord) {
    throw new AppError(404, "Attendance record not found");
  }

  if (user.role === "student" && attendanceRecord.studentId !== user.id) {
    throw new AppError(403, "You can only reschedule your own classes");
  }

  parseDateOnly(input.requestedDate, "requestedDate");

  return createRescheduleRequest({
    originalAttendanceId: input.attendanceId,
    studentId: attendanceRecord.studentId,
    requestedDate: input.requestedDate,
    requestedSlotId: input.requestedSlotId ?? null,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

export async function listRescheduleRequestsService(
  status?: "pending" | "approved" | "rejected"
) {
  return listRescheduleRequests(status);
}

export async function updateRescheduleRequestService(
  id: string,
  patch: RescheduleRequestUpdateInput,
  user: AuthUser
) {
  ensureAdminAccess(user);

  const existing = await getRescheduleRequestById(id);
  if (!existing) {
    throw new AppError(404, "Reschedule request not found");
  }

  if (patch.status === "rejected") {
    const updated = await updateRescheduleRequest(id, { status: "rejected" });
    if (!updated) {
      throw new AppError(404, "Reschedule request not found");
    }
    return updated;
  }

  if (!existing.requestedSlotId) {
    throw new AppError(400, "Requested slot is required for approval");
  }

  const attendanceRecord = await getAttendanceById(existing.originalAttendanceId);
  if (!attendanceRecord) {
    throw new AppError(404, "Attendance record not found");
  }

  const originalSlot = await getClassroomSlotWithCourseTeacher(attendanceRecord.classroomSlotId);
  const requestedSlot = await getClassroomSlotWithCourseTeacher(existing.requestedSlotId);

  if (!originalSlot?.slot || !requestedSlot?.slot) {
    throw new AppError(400, "Classroom slot not found for reschedule");
  }

  if (
    originalSlot.slot.courseId !== requestedSlot.slot.courseId ||
    originalSlot.slot.teacherId !== requestedSlot.slot.teacherId
  ) {
    throw new AppError(400, "Requested slot must match course and teacher");
  }

  const counts = await countActiveEnrollments([requestedSlot.slot.id]);
  const currentCount = counts[0]?.count ?? 0;
  if (currentCount >= requestedSlot.slot.capacity) {
    throw new AppError(409, "Requested slot is at capacity");
  }

  await updateAttendanceById(attendanceRecord.id, {
    classroomSlotId: requestedSlot.slot.id,
    classDate: existing.requestedDate,
    updatedBy: user.id,
    updatedAt: new Date()
  });

  const updated = await updateRescheduleRequest(id, { status: "approved" });
  if (!updated) {
    throw new AppError(404, "Reschedule request not found");
  }

  return updated;
}

export async function listStudentsService(courseId?: string, teacherId?: string) {
  if (!courseId) {
    return [];
  }

  if (teacherId) {
    const exists = await existsClassroomSlotForCourseTeacher(courseId, teacherId);
    if (!exists) {
      return [];
    }
  }

  return listStudentsByCourse(courseId);
}

export async function createClassroomAssignmentService(
  input: ClassroomAssignmentInput,
  user: AuthUser
) {
  ensureAdminAccess(user);

  parseDateOnly(input.startDate, "startDate");

  const student = await getUserById(input.studentId);
  if (!student || student.role !== "student") {
    throw new AppError(400, "Student not found");
  }

  const slot = await getClassroomSlotById(input.classroomSlotId);
  if (!slot || !slot.isActive) {
    throw new AppError(400, "Classroom slot not found or inactive");
  }

  const admission = await getAdmissionForStudentCourse(input.studentId, slot.courseId);
  if (!admission) {
    throw new AppError(400, "No admission found for this student and course");
  }

  const existing = await getEnrollmentByStudentAndSlot(input.studentId, input.classroomSlotId);
  if (existing && existing.status === "active") {
    throw new AppError(409, "Student already enrolled in this classroom slot");
  }

  const counts = await countActiveEnrollments([input.classroomSlotId]);
  const currentCount = counts[0]?.count ?? 0;
  if (currentCount >= slot.capacity) {
    throw new AppError(409, "Classroom slot is at capacity");
  }

  const enrollment = await createEnrollment({
    studentId: input.studentId,
    classroomSlotId: input.classroomSlotId,
    admissionId: admission.id,
    startDate: input.startDate,
    status: input.status ?? "active"
  });

  await insertAttendanceRows([
    {
      studentId: input.studentId,
      classroomSlotId: input.classroomSlotId,
      classDate: input.startDate,
      status: "scheduled",
      updatedBy: user.id,
      updatedAt: new Date()
    }
  ]);

  return enrollment;
}
