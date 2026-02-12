import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  coursePlanCreateSchema,
  coursePlanListSchema,
  coursePlanUpdateSchema
} from "./admission.schemas";
import {
  createCoursePlanService,
  deleteCoursePlanService,
  listCoursePlansService,
  updateCoursePlanService
} from "./course-plan.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listCoursePlans(req: Request, res: Response) {
  const parsed = coursePlanListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const plans = await listCoursePlansService(parsed.data.isActive);
    res.json({ data: plans });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createCoursePlan(req: Request, res: Response) {
  const parsed = coursePlanCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const plan = await createCoursePlanService(parsed.data);
    res.status(201).json({ data: plan });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateCoursePlan(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = coursePlanUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const plan = await updateCoursePlanService(params.data.id, parsed.data);
    res.json({ data: plan });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteCoursePlan(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    await deleteCoursePlanService(params.data.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
