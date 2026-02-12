import { AppError } from "../common/errors";
import { notifyRoles } from "../notifications/notification.service";
import type { AuthUser } from "../middleware/auth";
import {
  createLead,
  getLeadById,
  insertLeadAuditEvent,
  insertLeadNotes,
  listLeads,
  softDeleteLead,
  updateLead
} from "./lead.repo";
import { parseLeadCsv } from "./lead.bulk";
import type { LeadCreateInput, LeadListFilters, LeadUpdateInput } from "./lead.types";
import { getNewLeadStage } from "./lead-stage.repo";

function ensureFollowUpDate(dateValue?: string) {
  if (!dateValue) {
    return;
  }

  const followUp = new Date(dateValue);
  if (Number.isNaN(followUp.getTime())) {
    throw new AppError(400, "Invalid followUpDate");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (followUp < today) {
    throw new AppError(400, "followUpDate cannot be in the past");
  }
}

function ensureStaffOwnership(user: AuthUser, leadOwnerId?: string | null) {
  if (user.role !== "staff") {
    return;
  }

  if (!leadOwnerId || leadOwnerId !== user.id) {
    throw new AppError(403, "Staff can only update their own leads");
  }
}

export async function listLeadsService(filters: LeadListFilters, page?: number, pageSize?: number) {
  return listLeads(filters, page, pageSize);
}

export async function getLeadService(id: string) {
  const lead = await getLeadById(id);
  if (!lead) {
    throw new AppError(404, "Lead not found");
  }
  return lead;
}

export async function createLeadService(input: LeadCreateInput, user: AuthUser) {
  ensureFollowUpDate(input.followUpDate);

  const lead = await createLead({
    ...input,
    followUpStatus: input.followUpStatus ?? "open"
  });

  if (lead) {
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "created",
      meta: { createdByRole: user.role },
      createdBy: user.id
    });
  }

  return lead;
}

export async function updateLeadService(
  id: string,
  patch: LeadUpdateInput,
  user: AuthUser
) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureStaffOwnership(user, existing.ownerId);
  ensureFollowUpDate(patch.followUpDate);

  const lead = await updateLead(id, patch);

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  const followUpStatusChanged =
    patch.followUpStatus && patch.followUpStatus !== existing.followUpStatus;

  await insertLeadAuditEvent({
    leadId: lead.id,
    eventType: "updated",
    meta: { patch },
    createdBy: user.id
  });

  if (followUpStatusChanged) {
    await notifyRoles({
      roles: ["admin", "super_admin"],
      type: "lead_followup_status_changed",
      title: "Lead follow-up updated",
      body: `${lead.firstName} ${lead.lastName} follow-up marked ${patch.followUpStatus}.`,
      entityType: "lead",
      entityId: lead.id,
      ctaUrl: `/leads?leadId=${lead.id}`
    });
  }

  return lead;
}

export async function softDeleteLeadService(id: string, user: AuthUser) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureStaffOwnership(user, existing.ownerId);

  const deleted = await softDeleteLead(id);
  if (!deleted) {
    throw new AppError(404, "Lead not found");
  }

  await insertLeadAuditEvent({
    leadId: id,
    eventType: "deleted",
    createdBy: user.id
  });

  return deleted;
}

export async function addLeadNoteService(
  leadId: string,
  body: string,
  user: AuthUser
) {
  const existing = await getLeadById(leadId);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureStaffOwnership(user, existing.ownerId);

  const note = await insertLeadNotes(leadId, body, user.id);
  await insertLeadAuditEvent({
    leadId,
    eventType: "note_added",
    createdBy: user.id
  });
  return note;
}

export async function bulkImportLeadsService(csvText: string, user: AuthUser) {
  const { rows, errors } = parseLeadCsv(csvText);
  const stage = await getNewLeadStage();

  if (!stage) {
    throw new AppError(400, "Default stage 'New' is missing or inactive");
  }

  const created = [] as Array<{ id: string }>;

  for (const row of rows) {
    const followUpDate = row.followUpDate || new Date().toISOString().slice(0, 10);
    ensureFollowUpDate(followUpDate);

    const lead = await createLead({
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      email: row.email,
      interest: row.interest,
      source: row.source,
      notes: row.notes,
      stageId: stage.id,
      followUpDate,
      followUpStatus: "open"
    });

    if (lead) {
      created.push({ id: lead.id });
      await insertLeadAuditEvent({
        leadId: lead.id,
        eventType: "bulk_imported",
        createdBy: user.id
      });
    }
  }

  return { createdCount: created.length, errorCount: errors.length, errors };
}
