export type AdmissionStatus = "pending" | "active" | "completed" | "cancelled"

export type Admission = {
  id: string
  leadId: string
  lead?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string | null
  } | null
  studentId?: string | null
  coursePlanId: string
  courseId: string
  startDate: string
  baseClasses: number
  extraClasses: number
  finalClasses: number
  status: AdmissionStatus
  createdAt: string
}

export type AdmissionsResponse = {
  data: Array<{ admission: Admission; lead: Admission["lead"] }>
  total: number
}

export type CoursePlan = {
  id: string
  name: string
  price: number
  classesPerWeek: number
  totalClasses: number
  durationMonths: number
  isActive: boolean
}

export type CoursePlansResponse = {
  data: CoursePlan[]
}

export type LeadStage = {
  id: string
  name: string
  isOnboarded: boolean
  isActive: boolean
}

export type Lead = {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  stageId: string
  ownerId?: string | null
}

export type LeadStagesResponse = {
  data: LeadStage[]
}

export type LeadsResponse = {
  data: Lead[]
  total: number
}

export type Course = {
  id: string
  name: string
  instrumentName: string
}

export type CoursesResponse = {
  data: Course[]
  total: number
}

export type OperatingDay = {
  dayOfWeek: number
  isOpen: boolean
}

export type OperatingDaysResponse = {
  data: OperatingDay[]
}

export type TimeSlot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export type TimeSlotsResponse = {
  data: TimeSlot[]
}

export type ClassroomSlot = {
  id: string
  timeSlotId: string
  courseId: string
  capacity: number
  occupancy: number
}

export type ClassroomSlotsResponse = {
  data: ClassroomSlot[]
}

export type AdmissionPrerequisitesResponse = {
  data: {
    leads: Lead[]
    coursePlans: CoursePlan[]
    courses: Course[]
    operatingDays: OperatingDay[]
    slotOptions: Array<{
      classroomSlotId: string | null
      timeSlotId: string
      dayOfWeek: number
      startTime: string
      endTime: string
      capacity: number
      occupancy: number
    }>
  }
}
