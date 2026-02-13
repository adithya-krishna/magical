import { AppError } from "../common/errors";
import { hashPassword } from "better-auth/crypto";
import { auth } from "../auth";
import type { AuthUser } from "../middleware/auth";
import {
  createCredentialAccount,
  createStudentProgress,
  createUserAttendance,
  deleteStudentProgress,
  deleteUserAttendance,
  getCredentialAccountByUserId,
  getUserByRole,
  listStudentProgress,
  listStudentRescheduleRequests,
  listUserAttendance,
  listUsersByRole,
  updateStudentProgress,
  updateCredentialPassword,
  updateUserAttendance,
  upsertUserProfile
} from "./users-management.repo";
import {
  canListRole,
  canMutateRole,
  type ManagedRole,
  type StudentProgressInput,
  type UserAttendanceInput,
  type UserListFilters,
  type UserProfilePatch
} from "./users-management.types";

function ensureDateNotFuture(dateString: string) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "Invalid workDate");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (date.getTime() > today.getTime()) {
    throw new AppError(400, "Attendance dates cannot be in the future");
  }
}

function canReadSelf(requester: AuthUser, role: ManagedRole, targetUserId: string) {
  return requester.role === role && requester.id === targetUserId;
}

function ensureListAccess(requester: AuthUser, role: ManagedRole) {
  if (!canListRole(requester.role, role)) {
    throw new AppError(403, "Forbidden");
  }
}

async function ensureReadAccess(requester: AuthUser, role: ManagedRole, targetUserId: string) {
  if (canReadSelf(requester, role, targetUserId)) {
    return;
  }

  ensureListAccess(requester, role);
}

function ensureMutateAccess(requester: AuthUser, role: ManagedRole) {
  if (!canMutateRole(requester.role, role)) {
    throw new AppError(403, "Forbidden");
  }
}

export async function listUsersByRoleService(
  role: ManagedRole,
  filters: UserListFilters,
  page: number | undefined,
  pageSize: number | undefined,
  requester: AuthUser
) {
  ensureListAccess(requester, role);
  return listUsersByRole(role, filters, page, pageSize);
}

export async function createUserByRoleService(
  role: ManagedRole,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    isActive?: boolean;
  },
  requester: AuthUser
) {
  ensureMutateAccess(requester, role);

  try {
    const created = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: `${input.firstName} ${input.lastName}`.trim(),
        role,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        isActive: input.isActive ?? true
      }
    });

    return created.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create user";
    if (message.toLowerCase().includes("already")) {
      throw new AppError(409, "User with this email already exists");
    }
    throw new AppError(400, message);
  }
}

export async function getUserByRoleService(
  role: ManagedRole,
  id: string,
  requester: AuthUser
) {
  await ensureReadAccess(requester, role, id);

  const user = await getUserByRole(role, id);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

export async function patchUserProfileService(
  role: ManagedRole,
  id: string,
  patch: UserProfilePatch,
  requester: AuthUser
) {
  ensureMutateAccess(requester, role);

  const user = await getUserByRole(role, id);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return upsertUserProfile(role, id, patch);
}

export async function listUserAttendanceService(
  role: ManagedRole,
  id: string,
  requester: AuthUser
) {
  await ensureReadAccess(requester, role, id);
  return listUserAttendance(id);
}

export async function createUserAttendanceService(
  role: ManagedRole,
  id: string,
  input: UserAttendanceInput,
  requester: AuthUser
) {
  ensureMutateAccess(requester, role);
  ensureDateNotFuture(input.workDate);

  const user = await getUserByRole(role, id);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return createUserAttendance(id, input);
}

export async function patchUserAttendanceService(
  role: ManagedRole,
  id: string,
  attendanceId: string,
  patch: Partial<UserAttendanceInput>,
  requester: AuthUser
) {
  ensureMutateAccess(requester, role);
  if (patch.workDate) {
    ensureDateNotFuture(patch.workDate);
  }

  const updated = await updateUserAttendance(id, attendanceId, patch);
  if (!updated) {
    throw new AppError(404, "Attendance record not found");
  }

  return updated;
}

export async function deleteUserAttendanceService(
  role: ManagedRole,
  id: string,
  attendanceId: string,
  requester: AuthUser
) {
  ensureMutateAccess(requester, role);
  const deleted = await deleteUserAttendance(id, attendanceId);
  if (!deleted) {
    throw new AppError(404, "Attendance record not found");
  }
}

export async function listStudentProgressService(id: string, requester: AuthUser) {
  await ensureReadAccess(requester, "student", id);
  return listStudentProgress(id);
}

export async function createStudentProgressService(
  id: string,
  input: StudentProgressInput,
  requester: AuthUser
) {
  ensureMutateAccess(requester, "student");
  const user = await getUserByRole("student", id);
  if (!user) {
    throw new AppError(404, "Student not found");
  }

  return createStudentProgress(id, input);
}

export async function patchStudentProgressService(
  id: string,
  progressId: string,
  patch: Partial<StudentProgressInput>,
  requester: AuthUser
) {
  ensureMutateAccess(requester, "student");
  const updated = await updateStudentProgress(id, progressId, patch);
  if (!updated) {
    throw new AppError(404, "Progress record not found");
  }

  return updated;
}

export async function deleteStudentProgressService(
  id: string,
  progressId: string,
  requester: AuthUser
) {
  ensureMutateAccess(requester, "student");
  const deleted = await deleteStudentProgress(id, progressId);
  if (!deleted) {
    throw new AppError(404, "Progress record not found");
  }
}

export async function listStudentRescheduleRequestsService(id: string, requester: AuthUser) {
  await ensureReadAccess(requester, "student", id);
  return listStudentRescheduleRequests(id);
}

export async function setStudentTemporaryPasswordService(
  studentId: string,
  password: string,
  requester: AuthUser
) {
  if (!(requester.role === "super_admin" || requester.role === "admin")) {
    throw new AppError(403, "Forbidden");
  }

  const student = await getUserByRole("student", studentId);
  if (!student) {
    throw new AppError(404, "Student not found");
  }

  const passwordHash = await hashPassword(password);
  const existing = await getCredentialAccountByUserId(studentId);

  if (existing) {
    await updateCredentialPassword(existing.id, passwordHash);
    return;
  }

  await createCredentialAccount(studentId, passwordHash);
}
