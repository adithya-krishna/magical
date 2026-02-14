import express, { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  addLeadNote,
  bulkUpload,
  createLead,
  deleteLead,
  getLeadDetails,
  getLead,
  listLeadHistory,
  listLeadNotes,
  listLeads,
  updateLead,
  updateLeadProfile,
  updateLeadWorkflow,
  upsertLeadTags
} from "./lead.controller";

export const leadsRouter = Router();

leadsRouter.use(requireAuth);

leadsRouter.get("/", requireRole(["super_admin", "admin", "staff", "teacher"]), listLeads);
leadsRouter.post("/", requireRole(["super_admin", "admin", "staff"]), createLead);
leadsRouter.get("/:id/details", requireRole(["super_admin", "admin", "staff", "teacher"]), getLeadDetails);
leadsRouter.get("/:id/notes", requireRole(["super_admin", "admin", "staff", "teacher"]), listLeadNotes);
leadsRouter.post("/:id/notes", requireRole(["super_admin", "admin", "staff", "teacher"]), addLeadNote);
leadsRouter.get("/:id/history", requireRole(["super_admin", "admin", "staff", "teacher"]), listLeadHistory);
leadsRouter.patch("/:id/workflow", requireRole(["super_admin", "admin", "staff"]), updateLeadWorkflow);
leadsRouter.patch("/:id/profile", requireRole(["super_admin", "admin", "staff"]), updateLeadProfile);
leadsRouter.put("/:id/tags", requireRole(["super_admin", "admin", "staff"]), upsertLeadTags);

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

leadsRouter.get("/:id", requireRole(["super_admin", "admin", "staff", "teacher"]), getLead);
leadsRouter.patch("/:id", requireRole(["super_admin", "admin", "staff"]), updateLead);
leadsRouter.delete("/:id", requireRole(["super_admin", "admin", "staff"]), deleteLead);
