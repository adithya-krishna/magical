import { z } from "zod"

export type Instrument = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type InstrumentsResponse = {
  data: Instrument[]
}

export const instrumentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  isActive: z.boolean(),
})

export type InstrumentFormValues = z.infer<typeof instrumentFormSchema>

export function toInstrumentFormValues(instrument?: Instrument | null): InstrumentFormValues {
  return {
    name: instrument?.name ?? "",
    isActive: instrument?.isActive ?? true,
  }
}
