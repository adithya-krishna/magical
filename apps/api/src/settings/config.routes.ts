import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getSettingsConfig, updateSettingsConfig } from "./config.controller";

export const settingsConfigRouter = Router();

settingsConfigRouter.use(requireAuth);

settingsConfigRouter.get("/", requireRole(["super_admin", "admin", "staff"]), getSettingsConfig);
settingsConfigRouter.patch("/", requireRole(["super_admin", "admin"]), updateSettingsConfig);
