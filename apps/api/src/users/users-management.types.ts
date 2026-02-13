import type { UserRole } from "../middleware/auth";

export type ManagedRole = "student" | "teacher" | "staff" | "admin";

export type UserListFilters = {
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "lastName";
  sortOrder?: "asc" | "desc";
};

export type UserProfilePatch = {
  department?: string | null;
  hireDate?: string | null;
  admissionId?: string | null;
  primaryInstrument?: string | null;
  secondaryInstruments?: string[] | null;
  hourlyRate?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  startDate?: string | null;
  bio?: string | null;
  notes?: string | null;
};

export type UserAttendanceInput = {
  workDate: string;
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
};

export type StudentProgressInput = {
  skillArea: string;
  level: string;
  notes?: string;
};

export function canListRole(requesterRole: UserRole, role: ManagedRole) {
  if (requesterRole === "super_admin") {
    return true;
  }

  if (role === "admin") {
    return false;
  }

  if (role === "staff") {
    return requesterRole === "admin";
  }

  if (role === "teacher") {
    return requesterRole === "admin" || requesterRole === "staff";
  }

  if (role === "student") {
    return requesterRole === "admin" || requesterRole === "staff";
  }

  return false;
}

export function canMutateRole(requesterRole: UserRole, role: ManagedRole) {
  if (requesterRole === "super_admin") {
    return true;
  }

  if (requesterRole !== "admin") {
    return false;
  }

  return role === "staff" || role === "teacher" || role === "student";
}
