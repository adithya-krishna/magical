import { AppError } from "../common/errors";
import type { AuthUser } from "../middleware/auth";
import { notifyUsers } from "../notifications/notification.service";
import { listActiveUsersByRoles } from "../users/user.repo";
import { parseLeadCsv } from "./lead.bulk";
import { getActiveLeadStageByName, getNewLeadStage } from "./lead-stage.repo";
import {
  createLead,
  getLeadAlertSummary,
  getLeadById,
  insertLeadAuditEvent,
  insertLeadNotes,
  listLeadHistory,
  listLeadNotes,
  listLeads,
  listLeadTags,
  listStaffLoadCounts,
  replaceLeadTags,
  softDeleteLead,
  updateLead,
  updateLeadProfile,
  updateLeadWorkflow
} from "./lead.repo";
import type {
  LeadCreateInput,
  LeadListFilters,
  LeadProfilePatchInput,
  LeadUpdateInput,
  LeadWorkflowPatchInput
} from "./lead.types";

function ensureDateString(value?: string | null, field = "date") {
  if (value === undefined || value === null) {
    return;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `Invalid ${field}`);
  }
}

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

function ensureTeacherAccess(user: AuthUser, assignedTeacherId?: string | null) {
  if (user.role !== "teacher") {
    return;
  }

  if (!assignedTeacherId || assignedTeacherId !== user.id) {
    throw new AppError(403, "Teachers can only access leads assigned to them");
  }
}

function ensureTeacherWriteOnlyNotes(user: AuthUser) {
  if (user.role === "teacher") {
    throw new AppError(403, "Teachers can only add notes");
  }
}

async function resolveDefaultLeadStage() {
  const dueForValidation = await getActiveLeadStageByName("Due for validation");
  if (dueForValidation) {
    return dueForValidation;
  }

  const newStage = await getNewLeadStage();
  if (newStage) {
    return newStage;
  }

  throw new AppError(400, "Default lead stage is missing");
}

async function pickStaffOwnerId() {
  const staffUsers = await listActiveUsersByRoles(["staff"]);
  if (staffUsers.length === 0) {
    throw new AppError(400, "No active staff found for lead assignment");
  }

  const counts = await listStaffLoadCounts(staffUsers.map((user) => user.id));
  const countMap = new Map<string, number>();
  for (const item of counts) {
    if (item.ownerId) {
      countMap.set(item.ownerId, Number(item.count ?? 0));
    }
  }

  const selected = [...staffUsers].sort((a, b) => {
    const aCount = countMap.get(a.id) ?? 0;
    const bCount = countMap.get(b.id) ?? 0;
    if (aCount !== bCount) {
      return aCount - bCount;
    }
    return a.id.localeCompare(b.id);
  })[0];

  if (!selected) {
    throw new AppError(400, "No staff available");
  }

  return selected.id;
}

export async function listLeadsService(
  filters: LeadListFilters,
  user: AuthUser,
  page?: number,
  pageSize?: number
) {
  const scopedFilters =
    user.role === "teacher"
      ? {
          ...filters,
          assignedTeacherId: user.id
        }
      : filters;

  return listLeads(scopedFilters, page, pageSize);
}

export async function getLeadService(id: string, user: AuthUser) {
  const lead = await getLeadById(id);
  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherAccess(user, lead.assignedTeacherId);
  return lead;
}

export async function getLeadDetailsService(id: string, user: AuthUser) {
  const lead = await getLeadService(id, user);
  const [notes, history, tags, alerts] = await Promise.all([
    listLeadNotes(id),
    listLeadHistory(id),
    listLeadTags(id),
    getLeadAlertSummary(id)
  ]);

  return {
    lead,
    notes,
    history,
    tags,
    alerts
  };
}

export async function createLeadService(input: LeadCreateInput, user: AuthUser) {
  ensureTeacherWriteOnlyNotes(user);
  ensureFollowUpDate(input.followUpDate);
  ensureDateString(input.nextFollowUp, "nextFollowUp");
  ensureDateString(input.lastContactedDate, "lastContactedDate");

  const [defaultStageId, ownerId] = await Promise.all([
    input.stageId ? Promise.resolve(input.stageId) : resolveDefaultLeadStage().then((stage) => stage.id),
    input.ownerId ? Promise.resolve(input.ownerId) : pickStaffOwnerId()
  ]);

  const lead = await createLead({
    ...input,
    stageId: defaultStageId,
    ownerId,
    followUpStatus: input.followUpStatus ?? "open"
  });

  if (lead) {
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "created",
      meta: { createdByRole: user.role },
      createdBy: user.id
    });
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "owner_changed",
      meta: { before: null, after: ownerId },
      createdBy: user.id
    });
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "stage_changed",
      meta: { before: null, after: defaultStageId },
      createdBy: user.id
    });
  }

  return lead;
}

export async function updateLeadService(id: string, patch: LeadUpdateInput, user: AuthUser) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherWriteOnlyNotes(user);
  ensureStaffOwnership(user, existing.ownerId);
  ensureTeacherAccess(user, existing.assignedTeacherId);
  ensureFollowUpDate(patch.followUpDate);
  ensureDateString(patch.nextFollowUp, "nextFollowUp");
  ensureDateString(patch.lastContactedDate, "lastContactedDate");

  const lead = await updateLead(id, patch);

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  await insertLeadAuditEvent({
    leadId: lead.id,
    eventType: "updated",
    meta: { before: existing, patch },
    createdBy: user.id
  });

  if (existing.assignedTeacherId !== lead.assignedTeacherId && lead.assignedTeacherId) {
    await notifyUsers({
      userIds: [lead.assignedTeacherId],
      type: "lead_walkin_assigned",
      title: "New walk-in lead assigned",
      body: `${lead.firstName} ${lead.lastName} has been assigned to you for a walk-in.`,
      entityType: "lead",
      entityId: lead.id,
      ctaUrl: `/leads?leadId=${lead.id}`
    });
  }

  return lead;
}

export async function updateLeadWorkflowService(
  id: string,
  patch: LeadWorkflowPatchInput,
  user: AuthUser
) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherWriteOnlyNotes(user);
  ensureStaffOwnership(user, existing.ownerId);
  ensureTeacherAccess(user, existing.assignedTeacherId);
  ensureFollowUpDate(patch.followUpDate);
  ensureDateString(patch.nextFollowUp, "nextFollowUp");
  ensureDateString(patch.lastContactedDate, "lastContactedDate");

  const normalizedPatch = {
    ...patch,
    demoDate: patch.demoConducted && !patch.demoDate ? new Date().toISOString().slice(0, 10) : patch.demoDate
  };

  const lead = await updateLeadWorkflow(id, normalizedPatch);

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  await insertLeadAuditEvent({
    leadId: lead.id,
    eventType: "workflow_updated",
    meta: { before: existing, patch: normalizedPatch },
    createdBy: user.id
  });

  if (existing.stageId !== lead.stageId) {
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "stage_changed",
      meta: { before: existing.stageId, after: lead.stageId },
      createdBy: user.id
    });
  }

  if (existing.ownerId !== lead.ownerId) {
    await insertLeadAuditEvent({
      leadId: lead.id,
      eventType: "owner_changed",
      meta: { before: existing.ownerId, after: lead.ownerId },
      createdBy: user.id
    });
  }

  if (existing.assignedTeacherId !== lead.assignedTeacherId && lead.assignedTeacherId) {
    await notifyUsers({
      userIds: [lead.assignedTeacherId],
      type: "lead_walkin_assigned",
      title: "New walk-in lead assigned",
      body: `${lead.firstName} ${lead.lastName} has been assigned to you for a walk-in.`,
      entityType: "lead",
      entityId: lead.id,
      ctaUrl: `/leads?leadId=${lead.id}`
    });
  }

  return lead;
}

export async function updateLeadProfileService(id: string, patch: LeadProfilePatchInput, user: AuthUser) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherWriteOnlyNotes(user);
  ensureStaffOwnership(user, existing.ownerId);
  ensureTeacherAccess(user, existing.assignedTeacherId);

  const lead = await updateLeadProfile(id, patch);
  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  await insertLeadAuditEvent({
    leadId: lead.id,
    eventType: "profile_updated",
    meta: { before: existing, patch },
    createdBy: user.id
  });

  return lead;
}

export async function softDeleteLeadService(id: string, user: AuthUser) {
  const existing = await getLeadById(id);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherWriteOnlyNotes(user);
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

export async function addLeadNoteService(leadId: string, body: string, user: AuthUser) {
  const existing = await getLeadById(leadId);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  if (user.role === "staff") {
    ensureStaffOwnership(user, existing.ownerId);
  }
  ensureTeacherAccess(user, existing.assignedTeacherId);

  const note = await insertLeadNotes(leadId, body, user.id);
  await insertLeadAuditEvent({
    leadId,
    eventType: "note_added",
    meta: { noteId: note.id },
    createdBy: user.id
  });
  return note;
}

export async function listLeadNotesService(leadId: string, user: AuthUser) {
  await getLeadService(leadId, user);
  return listLeadNotes(leadId);
}

export async function listLeadHistoryService(leadId: string, user: AuthUser) {
  await getLeadService(leadId, user);
  return listLeadHistory(leadId);
}

export async function replaceLeadTagsService(leadId: string, tags: string[], user: AuthUser) {
  const existing = await getLeadById(leadId);
  if (!existing) {
    throw new AppError(404, "Lead not found");
  }

  ensureTeacherWriteOnlyNotes(user);
  ensureStaffOwnership(user, existing.ownerId);

  const updatedTags = await replaceLeadTags(leadId, tags, user.id);
  await insertLeadAuditEvent({
    leadId,
    eventType: "tags_updated",
    meta: { tags },
    createdBy: user.id
  });

  return updatedTags;
}

export async function bulkImportLeadsService(csvText: string, user: AuthUser) {
  ensureTeacherWriteOnlyNotes(user);

  const { rows, errors } = parseLeadCsv(csvText);
  const stage = await resolveDefaultLeadStage();

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
      ownerId: await pickStaffOwnerId(),
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
