export type AppRole = "super_admin" | "admin" | "staff" | "teacher" | "student"

export type DashboardSlot = {
  id: string
  courseId: string
  teacherId: string
  capacity: number
  occupancy: number
  timeSlot?: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  } | null
  course?: { id: string; name?: string | null } | null
  teacher?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

export type DashboardGroup = {
  timeSlot?: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  } | null
  slots: DashboardSlot[]
}

export type AttendanceRow = {
  attendance: {
    id: string
    studentId: string
    classroomSlotId: string
    classDate: string
    status: "scheduled" | "present" | "absent" | "late" | "excused"
  }
  student?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

export type StudentOption = {
  id: string
  firstName: string
  lastName: string
  email: string
}

export type TimeSlot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  durationMinutes: number
  isActive: boolean
}

export type ClassroomSlot = {
  id: string
  courseId: string
  teacherId: string
  capacity: number
  occupancy: number
  isActive: boolean
  timeSlot?: {
    id?: string
    dayOfWeek?: number
    startTime?: string
    endTime?: string
  } | null
  course?: { id?: string; name?: string | null } | null
  teacher?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

export type RescheduleRow = {
  id: string
  studentId: string
  originalAttendanceId: string
  requestedDate: string
  requestedSlotId?: string | null
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export type SettingsConfigResponse = {
  data: Array<{
    dayOfWeek: number
    isOpen: boolean
    startTime: string | null
    endTime: string | null
    slots: Array<{ id: string; startTime: string; endTime: string }>
  }>
}

export type CourseOption = { id: string; name: string }

export type TeacherOption = {
  id: string
  firstName?: string | null
  lastName?: string | null
  email: string
}
