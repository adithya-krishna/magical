import { AppError } from "../common/errors";
import type { AuthUser } from "../middleware/auth";
import {
  countActiveEnrollments,
  createAdmissionTransaction,
  getAdmissionById,
  getAdmissionWithLead,
  getClassroomSlotsForCourse,
  getCoursePlanById,
  getLeadWithStage,
  getOperatingDaysByWeekdays,
  getTimeSlotTemplates,
  getUserById,
  listAdmissions,
  softDeleteAdmission,
  updateAdmission
} from "./admission.repo";
import type {
  AdmissionCreateInput,
  AdmissionListFilters,
  AdmissionUpdateInput,
  DiscountType,
  WeeklySlotInput
} from "./admission.types";

function parseDateOnly(value: string, fieldLabel: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${fieldLabel}`);
  }
  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDiscount(
  discountType: DiscountType | undefined,
  discountValue: number | undefined
) {
  const type = discountType ?? "none";
  const value = discountValue ?? 0;

  if (value < 0) {
    throw new AppError(400, "discountValue must be >= 0");
  }

  if (type === "percent" && value > 100) {
    throw new AppError(400, "discountValue must be <= 100 for percent discounts");
  }

  if (type === "none") {
    return { type, value: 0 };
  }

  return { type, value };
}

function ensureStaffOwnership(user: AuthUser, createdBy?: string | null) {
  if (user.role !== "staff") {
    return;
  }

  if (!createdBy || createdBy !== user.id) {
    throw new AppError(403, "Staff can only access admissions they created");
  }
}

function ensureStaffLeadOwnership(user: AuthUser, leadOwnerId?: string | null) {
  if (user.role !== "staff") {
    return;
  }

  if (!leadOwnerId || leadOwnerId !== user.id) {
    throw new AppError(403, "Staff can only admit their own leads");
  }
}

function buildWeeklySlotPayload(
  requestedSlots: WeeklySlotInput[],
  timeSlots: Array<{ id: string; dayOfWeek: number; isActive: boolean }>
) {
  const byId = new Map(timeSlots.map((slot) => [slot.id, slot]));
  const payload = requestedSlots.map((slot) => {
    const template = byId.get(slot.timeSlotId);
    if (!template) {
      throw new AppError(400, `Time slot ${slot.timeSlotId} not found`);
    }
    if (!template.isActive) {
      throw new AppError(400, `Time slot ${slot.timeSlotId} is inactive`);
    }
    if (slot.dayOfWeek !== undefined && slot.dayOfWeek !== template.dayOfWeek) {
      throw new AppError(400, `Time slot ${slot.timeSlotId} does not match selected day`);
    }
    return { timeSlotId: template.id, dayOfWeek: template.dayOfWeek };
  });

  return { payload, weekdays: Array.from(new Set(payload.map((slot) => slot.dayOfWeek))) };
}

function generateAttendanceDates(
  startDate: string,
  totalClasses: number,
  slots: Array<{ dayOfWeek: number; classroomSlotId: string }>
) {
  const start = parseDateOnly(startDate, "startDate");
  const slotsByDay = new Map<number, Array<{ classroomSlotId: string }>>();

  for (const slot of slots) {
    const existing = slotsByDay.get(slot.dayOfWeek) ?? [];
    existing.push({ classroomSlotId: slot.classroomSlotId });
    slotsByDay.set(slot.dayOfWeek, existing);
  }

  const results: Array<{ classroomSlotId: string; classDate: string }> = [];
  const maxDays = totalClasses * 7 + 7;
  let current = new Date(start.getTime());

  for (let dayCount = 0; dayCount <= maxDays && results.length < totalClasses; dayCount += 1) {
    const dayOfWeek = current.getUTCDay();
    const daySlots = slotsByDay.get(dayOfWeek) ?? [];
    for (const slot of daySlots) {
      if (results.length >= totalClasses) {
        break;
      }
      results.push({ classroomSlotId: slot.classroomSlotId, classDate: formatDateOnly(current) });
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (results.length < totalClasses) {
    throw new AppError(400, "Unable to generate attendance schedule for selected slots");
  }

  return results;
}

export async function listAdmissionsService(
  filters: AdmissionListFilters,
  page: number | undefined,
  pageSize: number | undefined,
  user: AuthUser
) {
  const effectiveFilters = { ...filters };

  if (user.role === "staff") {
    effectiveFilters.ownerId = user.id;
  }

  return listAdmissions(effectiveFilters, page, pageSize);
}

export async function getAdmissionService(id: string, user: AuthUser) {
  const record = await getAdmissionWithLead(id);
  if (!record?.admission) {
    throw new AppError(404, "Admission not found");
  }

  ensureStaffOwnership(user, record.admission.createdBy);
  return record.admission;
}

export async function createAdmissionService(input: AdmissionCreateInput, user: AuthUser) {
  parseDateOnly(input.startDate, "startDate");

  const leadRecord = await getLeadWithStage(input.leadId);
  if (!leadRecord?.lead) {
    throw new AppError(404, "Lead not found");
  }

  if (!leadRecord.stage?.isOnboarded) {
    throw new AppError(400, "Lead must be in an onboarded stage to create an admission");
  }

  ensureStaffLeadOwnership(user, leadRecord.lead.ownerId);

  const coursePlan = await getCoursePlanById(input.coursePlanId);
  if (!coursePlan || !coursePlan.isActive) {
    throw new AppError(400, "Course plan is missing or inactive");
  }

  if (input.weeklySlots.length !== coursePlan.classesPerWeek) {
    throw new AppError(400, "Weekly slot count must match course plan classes per week");
  }

  const { type: discountType, value: discountValue } = normalizeDiscount(
    input.discountType,
    input.discountValue
  );
  const extraClasses = input.extraClasses ?? 0;
  const baseClasses = coursePlan.totalClasses;
  const finalClasses = baseClasses + extraClasses;

  const timeSlots = await getTimeSlotTemplates(input.weeklySlots.map((slot) => slot.timeSlotId));
  const { payload, weekdays } = buildWeeklySlotPayload(input.weeklySlots, timeSlots);

  const operating = await getOperatingDaysByWeekdays(weekdays);
  const openDaySet = new Set(
    operating.filter((day) => day.isOpen).map((day) => day.dayOfWeek)
  );

  for (const weekday of weekdays) {
    if (!openDaySet.has(weekday)) {
      throw new AppError(400, `Operating day ${weekday} is closed`);
    }
  }

  const classroomSlots = await getClassroomSlotsForCourse(
    input.courseId,
    payload.map((slot) => slot.timeSlotId)
  );

  const classroomSlotByTime = new Map<string, typeof classroomSlots[number]>();
  for (const slot of classroomSlots) {
    if (classroomSlotByTime.has(slot.timeSlotId)) {
      throw new AppError(400, `Multiple classroom slots found for time slot ${slot.timeSlotId}`);
    }
    classroomSlotByTime.set(slot.timeSlotId, slot);
  }

  const missingSlotIds = payload
    .filter((slot) => !classroomSlotByTime.has(slot.timeSlotId))
    .map((slot) => slot.timeSlotId);

  if (missingSlotIds.length > 0) {
    throw new AppError(400, "Missing classroom slots for selected times", {
      missingSlotIds
    });
  }

  const classroomSlotIds = payload.map((slot) => classroomSlotByTime.get(slot.timeSlotId)!.id);
  const enrollmentCounts = await countActiveEnrollments(classroomSlotIds);
  const countMap = new Map(enrollmentCounts.map((row) => [row.classroomSlotId, row.count]));
  const capacityIssues = classroomSlots
    .filter((slot) => {
      const count = countMap.get(slot.id) ?? 0;
      return count >= slot.capacity;
    })
    .map((slot) => ({
      classroomSlotId: slot.id,
      timeSlotId: slot.timeSlotId
    }));

  if (capacityIssues.length > 0) {
    throw new AppError(409, "One or more slots are at capacity", { capacityIssues });
  }

  if (input.studentId) {
    const student = await getUserById(input.studentId);
    if (!student || student.role !== "student") {
      throw new AppError(400, "Student profile not found");
    }
  }

  const slotSchedule = input.studentId
    ? payload.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        classroomSlotId: classroomSlotByTime.get(slot.timeSlotId)!.id
      }))
    : [];

  const attendanceRows = input.studentId
    ? generateAttendanceDates(input.startDate, finalClasses, slotSchedule).map((item) => ({
        studentId: input.studentId!,
        classroomSlotId: item.classroomSlotId,
        classDate: item.classDate,
        status: "scheduled" as const,
        updatedAt: new Date()
      }))
    : [];

  const admission = await createAdmissionTransaction({
    admissionValues: {
      leadId: input.leadId,
      studentId: input.studentId ?? null,
      coursePlanId: input.coursePlanId,
      courseId: input.courseId,
      startDate: input.startDate,
      weeklySlots: payload,
      baseClasses,
      extraClasses,
      discountType,
      discountValue: String(discountValue),
      finalClasses,
      status: input.status ?? "pending",
      notes: input.notes ?? null,
      createdBy: user.id
    },
    timeSlotIds: payload.map((slot) => slot.timeSlotId),
    enrollments: input.studentId
      ? classroomSlotIds.map((slotId) => ({
          studentId: input.studentId!,
          classroomSlotId: slotId,
          startDate: input.startDate,
          status: "active"
        }))
      : [],
    attendanceRows
  });

  if (!admission) {
    throw new AppError(500, "Failed to create admission");
  }

  return admission;
}

export async function updateAdmissionService(
  id: string,
  patch: AdmissionUpdateInput,
  user: AuthUser
) {
  const existing = await getAdmissionById(id);
  if (!existing) {
    throw new AppError(404, "Admission not found");
  }

  ensureStaffOwnership(user, existing.createdBy);

  const nextExtraClasses = patch.extraClasses ?? existing.extraClasses;
  const discountValue =
    patch.discountValue !== undefined
      ? patch.discountValue
      : Number(existing.discountValue ?? 0);
  const discountType = patch.discountType ?? existing.discountType;
  const normalizedDiscount = normalizeDiscount(discountType, discountValue);

  const finalClasses = existing.baseClasses + nextExtraClasses;

  const updated = await updateAdmission(id, {
    extraClasses: nextExtraClasses,
    discountType: normalizedDiscount.type,
    discountValue: String(normalizedDiscount.value),
    finalClasses,
    notes: patch.notes ?? existing.notes,
    status: patch.status ?? existing.status
  });

  if (!updated) {
    throw new AppError(404, "Admission not found");
  }

  return updated;
}

export async function deleteAdmissionService(id: string, user: AuthUser) {
  const existing = await getAdmissionById(id);
  if (!existing) {
    throw new AppError(404, "Admission not found");
  }

  ensureStaffOwnership(user, existing.createdBy);

  const deleted = await softDeleteAdmission(id);
  if (!deleted) {
    throw new AppError(404, "Admission not found");
  }
  return deleted;
}
