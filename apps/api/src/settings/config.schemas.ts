import { z } from "zod";

const settingsConfigDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

export const settingsConfigUpdateSchema = z.array(settingsConfigDaySchema).length(7);
