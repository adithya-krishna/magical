import { Request, Response } from "express";
import { isAppError } from "../common/errors";
import { z } from "zod";
import { leadStageSchema } from "./lead.schemas";
import {
  createLeadStageService,
  deleteLeadStageService,
  listLeadStagesService,
  updateLeadStageService
} from "./lead-stage.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listLeadStages(req: Request, res: Response) {
  try {
    const stages = await listLeadStagesService();
    res.json({ data: stages });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createLeadStage(req: Request, res: Response) {
  const parsed = leadStageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const stage = await createLeadStageService(parsed.data);
    res.status(201).json({ data: stage });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateLeadStage(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const body = leadStageSchema.partial().safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() });
    return;
  }

  try {
    const stage = await updateLeadStageService(params.data.id, body.data);
    res.json({ data: stage });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteLeadStage(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    await deleteLeadStageService(params.data.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
