import express, { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  addLeadNote,
  bulkUpload,
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead
} from "./lead.controller";

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

leadsRouter.get("/", requireRole(["super_admin", "admin", "staff"]), listLeads);
leadsRouter.post("/", requireRole(["super_admin", "admin", "staff"]), createLead);
leadsRouter.post("/:id/notes", requireRole(["super_admin", "admin", "staff"]), addLeadNote);

leadsRouter.post(
  "/bulk",
  requireRole(["super_admin", "admin", "staff"]),
  express.text({ type: ["text/csv", "application/csv"] }),
  bulkUpload
);

leadsRouter.get(
  "/template",
  requireRole(["super_admin", "admin", "staff"]),
  (_req, res) => {
    res.setHeader("Content-Type", "text/csv");
    res.send("firstName,lastName,phone,email,interest,source,notes,followUpDate\n");
  }
);

leadsRouter.get("/:id", requireRole(["super_admin", "admin", "staff"]), getLead);
leadsRouter.patch("/:id", requireRole(["super_admin", "admin", "staff"]), updateLead);
leadsRouter.delete("/:id", requireRole(["super_admin", "admin", "staff"]), deleteLead);
