import { Request, Response } from "express";
import { z } from "zod";
import { isAppError } from "../common/errors";
import {
  admissionCreateSchema,
  admissionListSchema,
  admissionUpdateSchema
} from "./admission.schemas";
import {
  createAdmissionService,
  deleteAdmissionService,
  getAdmissionService,
  listAdmissionsService,
  updateAdmissionService
} from "./admission.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listAdmissions(req: Request, res: Response) {
  const parsed = admissionListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { page, pageSize, ...filters } = parsed.data;
    const result = await listAdmissionsService(filters, page, pageSize, req.user);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getAdmission(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const admission = await getAdmissionService(params.data.id, req.user);
    res.json({ data: admission });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createAdmission(req: Request, res: Response) {
  const parsed = admissionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const admission = await createAdmissionService(parsed.data, req.user);
    res.status(201).json({ data: admission });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateAdmission(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = admissionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const admission = await updateAdmissionService(params.data.id, parsed.data, req.user);
    res.json({ data: admission });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteAdmission(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await deleteAdmissionService(params.data.id, req.user);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
