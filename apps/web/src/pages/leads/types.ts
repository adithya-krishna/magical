import { z } from "zod"

export type Lead = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
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

export type LeadsResponse = {
  data: Lead[]
  total: number
}

export type LeadDetailsResponse = {
  data: Lead
}

export type LeadStagesResponse = {
  data: LeadStage[]
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

export function toLeadFormValues(lead?: Lead | null): LeadFormValues {
  if (!lead) {
    return {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
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
    interest: values.interest || undefined,
    source: values.source || undefined,
    stageId: values.stageId,
    followUpDate: values.followUpDate,
    followUpStatus: values.followUpStatus,
    notes: values.notes || undefined,
  }
}
