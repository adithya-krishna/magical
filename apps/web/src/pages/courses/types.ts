import { z } from "zod"

export type InstrumentOption = {
  id: string
  name: string
  isActive: boolean
}

export type Course = {
  id: string
  instrumentId: string
  instrumentName: string
  name: string
  difficulty: "beginner" | "intermediate" | "advanced"
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CourseTeacher = {
  teacherId: string
  firstName: string
  lastName: string
  email: string
}

export type TeacherOption = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export type CoursesResponse = {
  data: Course[]
  total: number
}

export type CourseResponse = {
  data: Course
}

export type CourseTeachersResponse = {
  data: CourseTeacher[]
}

export type TeachersResponse = {
  data: TeacherOption[]
}

export const courseFormSchema = z.object({
  instrumentId: z.string().uuid("Instrument is required"),
  name: z.string().trim().min(1, "Name is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().trim().optional().transform((value) => value || ""),
  isActive: z.boolean(),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>

export function toCourseFormValues(course?: Course | null): CourseFormValues {
  return {
    instrumentId: course?.instrumentId ?? "",
    name: course?.name ?? "",
    difficulty: course?.difficulty ?? "beginner",
    description: course?.description ?? "",
    isActive: course?.isActive ?? true,
  }
}
