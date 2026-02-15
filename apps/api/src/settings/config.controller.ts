import { Request, Response } from "express";
import { isAppError } from "../common/errors";
import { settingsConfigUpdateSchema } from "./config.schemas";
import { getSettingsConfigService, updateSettingsConfigService } from "./config.service";

function handleError(res: Response, error: unknown) {
  if (isAppError(error)) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}

export async function getSettingsConfig(_req: Request, res: Response) {
  try {
    const data = await getSettingsConfigService();
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateSettingsConfig(req: Request, res: Response) {
  const parsed = settingsConfigUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await updateSettingsConfigService(parsed.data);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}
