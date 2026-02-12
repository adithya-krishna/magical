export type AttendanceStatus = "scheduled" | "present" | "absent" | "late" | "excused";

export type EnrollmentStatus = "active" | "paused" | "ended";

export type RescheduleStatus = "pending" | "approved" | "rejected";

export type OperatingDayUpdate = {
  dayOfWeek: number;
  isOpen: boolean;
};

export type TimeSlotCreateInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isActive?: boolean;
};

export type TimeSlotUpdateInput = Partial<TimeSlotCreateInput>;

export type ClassroomSlotCreateInput = {
  timeSlotId: string;
  courseId: string;
  teacherId: string;
  capacity: number;
  isActive?: boolean;
};

export type ClassroomSlotUpdateInput = Partial<ClassroomSlotCreateInput>;

export type ClassroomSlotFilters = {
  day?: number;
  courseId?: string;
  teacherId?: string;
};

export type AttendanceUpsertInput = {
  attendanceId?: string;
  studentId: string;
  classDate?: string;
  status: AttendanceStatus;
};

export type AttendanceUpdateInput = {
  status: AttendanceStatus;
};

export type RescheduleRequestCreateInput = {
  attendanceId: string;
  requestedDate: string;
  requestedSlotId?: string;
};

export type RescheduleRequestUpdateInput = {
  status: "approved" | "rejected";
};

export type ClassroomAssignmentInput = {
  studentId: string;
  classroomSlotId: string;
  startDate: string;
  status?: EnrollmentStatus;
};
