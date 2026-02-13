import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  instrumentCreateSchema,
  instrumentListSchema,
  instrumentUpdateSchema
} from "./courses.schemas";
import {
  archiveInstrumentService,
  createInstrumentService,
  listInstrumentsService,
  updateInstrumentService
} from "./instruments.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listInstruments(req: Request, res: Response) {
  const parsed = instrumentListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await listInstrumentsService(parsed.data);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createInstrument(req: Request, res: Response) {
  const parsed = instrumentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await createInstrumentService(parsed.data);
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchInstrument(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = instrumentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await updateInstrumentService(params.data.id, parsed.data);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteInstrument(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  try {
    await archiveInstrumentService(params.data.id);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
