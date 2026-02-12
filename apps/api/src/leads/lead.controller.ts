import { Request, Response } from "express";
import { isAppError } from "../common/errors";
import { z } from "zod";
import { leadCreateSchema, leadListSchema, leadUpdateSchema } from "./lead.schemas";
import {
  addLeadNoteService,
  bulkImportLeadsService,
  createLeadService,
  getLeadService,
  listLeadsService,
  softDeleteLeadService,
  updateLeadService
} from "./lead.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function listLeads(req: Request, res: Response) {
  const parsed = leadListSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { page, pageSize, ...filters } = parsed.data;
    const result = await listLeadsService(filters, page, pageSize);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getLead(req: Request, res: Response) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const lead = await getLeadService(parsed.data.id);
    res.json({ data: lead });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createLead(req: Request, res: Response) {
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const lead = await createLeadService(parsed.data, req.user);
    res.status(201).json({ data: lead });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateLead(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const lead = await updateLeadService(params.data.id, parsed.data, req.user);
    res.json({ data: lead });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteLead(req: Request, res: Response) {
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
    await softDeleteLeadService(params.data.id, req.user);
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function bulkUpload(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const csvText = typeof req.body === "string" ? req.body : "";
    if (!csvText.trim()) {
      res.status(400).json({ error: "CSV body is required" });
      return;
    }
    const result = await bulkImportLeadsService(csvText, req.user);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

export async function addLeadNote(req: Request, res: Response) {
  const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { body?: string };
  if (!body?.body) {
    res.status(400).json({ error: "Note body is required" });
    return;
  }

  try {
    const note = await addLeadNoteService(params.data.id, body.body, req.user);
    res.status(201).json({ data: note });
  } catch (error) {
    handleError(res, error);
  }
}
