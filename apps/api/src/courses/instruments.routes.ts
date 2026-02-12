import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createInstrument,
  deleteInstrument,
  listInstruments,
  patchInstrument
} from "./instruments.controller";

export const instrumentsRouter = Router();

instrumentsRouter.use(requireAuth);

instrumentsRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listInstruments);
instrumentsRouter.post("/", requireRole(["super_admin", "admin"]), createInstrument);
instrumentsRouter.patch("/:id", requireRole(["super_admin", "admin"]), patchInstrument);
instrumentsRouter.delete("/:id", requireRole(["super_admin", "admin"]), deleteInstrument);
