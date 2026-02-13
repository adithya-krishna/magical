import { AppError } from "../common/errors";
import { auth } from "../auth";
import type { AuthUser } from "../middleware/auth";
import { upsertUserProfile } from "../users/users-management.repo";
import {
  countActiveEnrollments,
  createLeadForAdmission,
  createAdmissionTransaction,
  getAdmissionById,
  getAdmissionWithLead,
  getClassroomSlotsForCourse,
  getCoursePlanById,
  getLeadWithStage,
  getOnboardedLeadStage,
  getOperatingDaysByWeekdays,
  getTimeSlotTemplates,
  listAdmissionPrerequisites,
  getUserById,
  getUserByEmail,
  listAdmissions,
  setLeadStage,
  softDeleteAdmission,
  updateAdmission
} from "./admission.repo";
import type {
  AdmissionCreateInput,
  AdmissionListFilters,
  AdmissionUpdateInput,
  DiscountType,
  WalkInStudentInput,
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

async function createWalkInStudentAndLead(input: WalkInStudentInput, user: AuthUser) {
  const existingUser = await getUserByEmail(input.email);
  if (existingUser) {
    throw new AppError(409, "Student email already exists");
  }

  let createdStudent: { id: string };
  try {
    const created = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: `${input.firstName} ${input.lastName}`.trim(),
        role: "student",
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        isActive: true
      }
    });

    createdStudent = created.user as { id: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create student";
    if (message.toLowerCase().includes("already")) {
      throw new AppError(409, "Student email already exists");
    }
    throw new AppError(400, message);
  }

  await upsertUserProfile("student", createdStudent.id, {
    startDate: new Date().toISOString().slice(0, 10)
  });

  const onboardedStage = await getOnboardedLeadStage();
  if (!onboardedStage) {
    throw new AppError(400, "No active onboarded lead stage configured");
  }

  const lead = await createLeadForAdmission({
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? "N/A",
    email: input.email,
    stageId: onboardedStage.id,
    ownerId: user.id,
    notes: "System-generated walk-in lead"
  });

  if (!lead) {
    throw new AppError(500, "Failed to create walk-in lead");
  }

  return { studentId: createdStudent.id, leadId: lead.id };
}

async function createStudentForAdmission(input: WalkInStudentInput) {
  const existingUser = await getUserByEmail(input.email);
  if (existingUser) {
    throw new AppError(409, "Student email already exists");
  }

  let createdStudent: { id: string };
  try {
    const created = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: `${input.firstName} ${input.lastName}`.trim(),
        role: "student",
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        isActive: true
      }
    });

    createdStudent = created.user as { id: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create student";
    if (message.toLowerCase().includes("already")) {
      throw new AppError(409, "Student email already exists");
    }
    throw new AppError(400, message);
  }

  await upsertUserProfile("student", createdStudent.id, {
    startDate: new Date().toISOString().slice(0, 10)
  });

  return createdStudent.id;
}

function generateTemporaryPassword() {
  return `Muzigal#${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

async function createOrAttachStudentFromLead(lead: {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
}) {
  if (!lead.email) {
    throw new AppError(400, "Lead email is required to create student account");
  }

  const existingUser = await getUserByEmail(lead.email);
  if (existingUser) {
    if (existingUser.role !== "student") {
      throw new AppError(409, "Lead email belongs to a non-student user");
    }
    return existingUser.id;
  }

  return createStudentForAdmission({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    password: generateTemporaryPassword()
  });
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

export async function listAdmissionPrerequisitesService(
  courseId: string | undefined,
  search: string | undefined,
  user: AuthUser
) {
  return listAdmissionPrerequisites(courseId, search, user.role === "staff" ? user.id : undefined);
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

  let leadId: string | undefined = input.leadId;
  let studentId = input.studentId;
  let leadRecord: Awaited<ReturnType<typeof getLeadWithStage>> | null = null;

  if (leadId) {
    leadRecord = await getLeadWithStage(leadId);
    if (!leadRecord?.lead) {
      throw new AppError(404, "Lead not found");
    }

    if (leadRecord.stage?.isOnboarded) {
      throw new AppError(400, "Lead is already onboarded");
    }

    ensureStaffLeadOwnership(user, leadRecord.lead.ownerId);
  } else if (!input.walkInStudent) {
    throw new AppError(400, "leadId is required");
  }

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

  if (input.walkInStudent && leadId) {
    studentId = await createStudentForAdmission(input.walkInStudent);
  }

  if (input.walkInStudent && !leadId) {
    const walkIn = await createWalkInStudentAndLead(input.walkInStudent, user);
    leadId = walkIn.leadId;
    studentId = walkIn.studentId;
    leadRecord = await getLeadWithStage(leadId);
  }

  if (!studentId && leadRecord?.lead) {
    studentId = await createOrAttachStudentFromLead({
      firstName: leadRecord.lead.firstName,
      lastName: leadRecord.lead.lastName,
      email: leadRecord.lead.email,
      phone: leadRecord.lead.phone
    });
  }

  if (!leadId) {
    throw new AppError(400, "leadId is required");
  }

  if (studentId) {
    const student = await getUserById(studentId);
    if (!student || student.role !== "student") {
      throw new AppError(400, "Student profile not found");
    }
  }

  const slotSchedule = (studentId
    ? payload.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        classroomSlotId: classroomSlotByTime.get(slot.timeSlotId)!.id
      }))
    : []) as Array<{ dayOfWeek: number; classroomSlotId: string }>;

  const attendanceRows = studentId
    ? generateAttendanceDates(input.startDate, finalClasses, slotSchedule).map((item) => ({
        studentId,
        classroomSlotId: item.classroomSlotId,
        classDate: item.classDate,
        status: "scheduled" as const,
        updatedAt: new Date()
      }))
    : [];

  const admission = await createAdmissionTransaction({
    admissionValues: {
      leadId,
      studentId: studentId ?? null,
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
    enrollments: studentId
      ? classroomSlotIds.map((slotId) => ({
          studentId,
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

  const onboardedStage = await getOnboardedLeadStage();
  if (!onboardedStage) {
    throw new AppError(400, "No active onboarded lead stage configured");
  }

  if (leadRecord?.lead && !leadRecord.stage?.isOnboarded) {
    await setLeadStage(leadRecord.lead.id, onboardedStage.id);
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
