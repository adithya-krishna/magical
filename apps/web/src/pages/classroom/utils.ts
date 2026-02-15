import { format, parse as parseTime } from "date-fns"
import type { AppRole } from "./types"

export const dayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export function isClassroomAllowed(role: AppRole) {
  return role === "super_admin" || role === "admin" || role === "staff"
}

export function canManageClassroom(role: AppRole) {
  return role === "super_admin" || role === "admin"
}

export function formatPersonName(person?: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}) {
  const fullName = `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim()
  return fullName || person?.email || "-"
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return fallback
}

export function formatTimeLabel(value?: string | null) {
  if (!value) {
    return "-"
  }

  const parsed = parseTime(value.slice(0, 5), "HH:mm", new Date())
  return format(parsed, "hh:mm a")
}

export function formatDayTime(dayOfWeek?: number, start?: string | null, end?: string | null) {
  const day = dayLabels[dayOfWeek ?? -1] ?? "Unknown"
  const time = `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`
  return { day, time }
}
