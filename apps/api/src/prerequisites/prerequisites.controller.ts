import { Request, Response } from "express";
import { isAppError } from "../common/errors";
import { updatePrerequisitesSchema } from "./prerequisites.schemas";
import { getPrerequisitesService, updatePrerequisitesService } from "./prerequisites.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function getPrerequisites(_req: Request, res: Response) {
  try {
    const data = await getPrerequisitesService();
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function updatePrerequisites(req: Request, res: Response) {
  const parsed = updatePrerequisitesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await updatePrerequisitesService(parsed.data);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}
