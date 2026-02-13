import { z } from "zod";

export const prerequisitesDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

export const updatePrerequisitesSchema = z.array(prerequisitesDaySchema).length(7);
