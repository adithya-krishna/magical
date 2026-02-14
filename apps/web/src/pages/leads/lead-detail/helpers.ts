import type { Lead } from "@/pages/leads/types"

const stageColorMap: Record<string, string> = {
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-amber-500": "#f59e0b",
  "bg-yellow-500": "#eab308",
  "bg-lime-500": "#84cc16",
  "bg-green-500": "#22c55e",
  "bg-emerald-500": "#10b981",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-sky-400": "#38bdf8",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-violet-500": "#8b5cf6",
  "bg-slate-500": "#64748b",
  "bg-gray-400": "#9ca3af",
}

export const leadTabs = ["follow-up", "history", "edit"] as const

export const stageUsageCopy: Record<string, string> = {
  "Due for validation": "Use right after lead creation while the first call is pending.",
  "Call not connected": "Use when repeated call attempts are needed before qualification.",
  "Walkin Expected": "Use once lead agrees to walk in and teacher/date are assigned.",
  "Walked in": "Use after the lead physically visits the institute.",
  Converted: "Use when the lead is ready for admission creation.",
}

export function getStageCardStyle(colorClass: string) {
  const hex = stageColorMap[colorClass] ?? "#94a3b8"
  return {
    backgroundColor: `${hex}26`,
    borderColor: `${hex}66`,
  }
}

export function toDateInput(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function toDatetimeInput(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

export function getInitials(lead: Lead) {
  return `${lead.firstName?.[0] ?? ""}${lead.lastName?.[0] ?? ""}`.toUpperCase() || "LD"
}
