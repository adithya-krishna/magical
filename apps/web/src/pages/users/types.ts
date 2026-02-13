import type { ManagedUserRole } from "@/lib/users-rbac"

export type UserListItem = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserListResponse = {
  data: UserListItem[]
  total: number
}

export type UserDetail = UserListItem & {
  role: ManagedUserRole
  profile?: {
    id: string
    department?: string | null
    hireDate?: string | null
    admissionId?: string | null
    primaryInstrument?: string | null
    secondaryInstruments?: string[] | null
    hourlyRate?: string | null
    guardianName?: string | null
    guardianPhone?: string | null
    startDate?: string | null
    bio?: string | null
    notes?: string | null
  } | null
}

export type UserDetailResponse = {
  data: UserDetail
}

export type UserAttendanceRecord = {
  id: string
  userId: string
  workDate: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type UserAttendanceResponse = {
  data: UserAttendanceRecord[]
}

export type StudentProgressRecord = {
  id: string
  studentId: string
  skillArea: string
  level: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type StudentProgressResponse = {
  data: StudentProgressRecord[]
}

export type StudentRescheduleRecord = {
  id: string
  studentId: string
  status: string
  requestedDate: string
  createdAt: string
}

export type StudentRescheduleResponse = {
  data: StudentRescheduleRecord[]
}
