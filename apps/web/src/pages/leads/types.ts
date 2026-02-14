import { z } from "zod"

export type Lead = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  area?: string | null
  community?: string | null
  address?: string | null
  guardianName?: string | null
  age?: number | null
  expectedBudget: number
  numberOfContactAttempts: number
  lastContactedDate?: string | null
  nextFollowUp?: string | null
  walkInDate?: string | null
  assignedTeacherId?: string | null
  demoDate?: string | null
  demoConducted: boolean
  interest?: string | null
  source?: string | null
  stageId: string
  ownerId?: string | null
  notes?: string | null
  followUpDate: string
  followUpStatus: "open" | "done"
  createdAt: string
  updatedAt: string
}

export type LeadStage = {
  id: string
  name: string
  color: string
  ordering: number
  isOnboarded: boolean
  isActive: boolean
}

export type LeadActor = {
  id: string
  firstName: string
  lastName: string
  role: "super_admin" | "admin" | "staff" | "teacher" | "student"
}

export type LeadNote = {
  id: string
  leadId: string
  body: string
  createdAt: string
  createdBy: string
  userFirstName: string
  userLastName: string
  userRole: LeadActor["role"]
}

export type LeadHistoryItem = {
  id: string
  leadId: string
  eventType: string
  meta?: Record<string, unknown>
  createdAt: string
  createdBy: string
  userFirstName: string
  userLastName: string
  userRole: LeadActor["role"]
}

export type LeadTag = {
  id: string
  leadId: string
  label: string
  createdBy: string
  createdAt: string
}

export type LeadAlert = {
  id: string
  severity: "info" | "warning" | "critical"
  message: string
}

export type LeadDetailsData = {
  lead: Lead
  notes: LeadNote[]
  history: LeadHistoryItem[]
  tags: LeadTag[]
  alerts: LeadAlert[]
}

export type LeadsResponse = {
  data: Lead[]
  total: number
}

export type LeadDetailsResponse = {
  data: LeadDetailsData
}

export type LeadStagesResponse = {
  data: LeadStage[]
}

export type LeadNotesResponse = {
  data: LeadNote[]
}

export type LeadHistoryResponse = {
  data: LeadHistoryItem[]
}

export type LeadTagsResponse = {
  data: LeadTag[]
}

const todayIso = new Date().toISOString().slice(0, 10)

export const leadFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().min(5, "Phone must be at least 5 characters"),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || "")
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Enter a valid email",
    }),
  area: z.string().trim().optional().transform((value) => value || ""),
  community: z.string().trim().optional().transform((value) => value || ""),
  address: z.string().trim().optional().transform((value) => value || ""),
  guardianName: z.string().trim().optional().transform((value) => value || ""),
  age: z.number().int().min(0).max(120).nullable().optional(),
  expectedBudget: z.number().int().min(0),
  interest: z.string().trim().optional().transform((value) => value || ""),
  source: z.string().trim().optional().transform((value) => value || ""),
  stageId: z.string().trim().min(1, "Stage is required"),
  followUpDate: z
    .string()
    .min(1, "Follow-up date is required")
    .refine((value) => value >= todayIso, {
      message: "Follow-up date cannot be in the past",
    }),
  followUpStatus: z.enum(["open", "done"]),
  notes: z.string().trim().optional().transform((value) => value || ""),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>

export type LeadWorkflowValues = {
  stageId: string
  ownerId?: string
  assignedTeacherId?: string
  walkInDate?: string
  followUpDate: string
  nextFollowUp?: string
  demoDate?: string
  demoConducted: boolean
  numberOfContactAttempts: number
  lastContactedDate?: string
}

export type LeadProfileValues = {
  firstName: string
  lastName: string
  phone: string
  email?: string
  area?: string
  community?: string
  address?: string
  guardianName?: string
  age?: number
  source?: string
  interest?: string
  expectedBudget: number
  notes?: string
}

export function toLeadFormValues(lead?: Lead | null): LeadFormValues {
  if (!lead) {
    return {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      area: "",
      community: "",
      address: "",
      guardianName: "",
      age: null,
      expectedBudget: 0,
      interest: "",
      source: "",
      stageId: "",
      followUpDate: todayIso,
      followUpStatus: "open",
      notes: "",
    }
  }

  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    email: lead.email ?? "",
    area: lead.area ?? "",
    community: lead.community ?? "",
    address: lead.address ?? "",
    guardianName: lead.guardianName ?? "",
    age: lead.age ?? null,
    expectedBudget: lead.expectedBudget ?? 0,
    interest: lead.interest ?? "",
    source: lead.source ?? "",
    stageId: lead.stageId,
    followUpDate: lead.followUpDate,
    followUpStatus: lead.followUpStatus,
    notes: lead.notes ?? "",
  }
}

export function toLeadPayload(values: LeadFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    email: values.email || undefined,
    area: values.area || undefined,
    community: values.community || undefined,
    address: values.address || undefined,
    guardianName: values.guardianName || undefined,
    age: values.age ?? undefined,
    expectedBudget: values.expectedBudget,
    interest: values.interest || undefined,
    source: values.source || undefined,
    stageId: values.stageId,
    followUpDate: values.followUpDate,
    followUpStatus: values.followUpStatus,
    notes: values.notes || undefined,
  }
}
