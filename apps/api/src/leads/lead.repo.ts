import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { PAGINATION_DEFAULT_PAGE_SIZE } from "../common/pagination";
import { db } from "../db";
import { leadAuditEvents, leadNotes, leadStages, leadTags, leads, users } from "../db/schema";
import type {
  LeadCreateInput,
  LeadListFilters,
  LeadProfilePatchInput,
  LeadUpdateInput,
  LeadWorkflowPatchInput
} from "./lead.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = PAGINATION_DEFAULT_PAGE_SIZE;

function toDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function listLeads(
  filters: LeadListFilters,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const whereClauses = [isNull(leads.deletedAt)];

  if (filters.stageId) {
    whereClauses.push(eq(leads.stageId, filters.stageId));
  }
  if (filters.excludeOnboarded) {
    whereClauses.push(eq(leadStages.isOnboarded, false));
  }
  if (filters.ownerId) {
    whereClauses.push(eq(leads.ownerId, filters.ownerId));
  }
  if (filters.assignedTeacherId) {
    whereClauses.push(eq(leads.assignedTeacherId, filters.assignedTeacherId));
  }
  if (filters.source) {
    whereClauses.push(eq(leads.source, filters.source));
  }
  if (filters.followUpStatus) {
    whereClauses.push(eq(leads.followUpStatus, filters.followUpStatus));
  }
  if (filters.followUpFrom) {
    whereClauses.push(sql`${leads.followUpDate} >= ${filters.followUpFrom}`);
  }
  if (filters.followUpTo) {
    whereClauses.push(sql`${leads.followUpDate} <= ${filters.followUpTo}`);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchClause = or(
      ilike(leads.firstName, term),
      ilike(leads.lastName, term),
      ilike(leads.phone, term),
      ilike(leads.email, term),
      ilike(leads.area, term),
      ilike(leads.community, term)
    );

    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  const clauses = whereClauses.filter((clause): clause is SQL => Boolean(clause));
  const where = and(...clauses);
  const offset = (page - 1) * pageSize;

  const data = await db
    .select()
    .from(leads)
    .leftJoin(leadStages, eq(leads.stageId, leadStages.id))
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset)
    .then((rows) => rows.map((row) => row.leads));

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .leftJoin(leadStages, eq(leads.stageId, leadStages.id))
    .where(where);

  return { data, total: Number(countResult[0]?.count ?? 0) };
}

export async function getLeadById(id: string) {
  const result = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function createLead(input: LeadCreateInput) {
  const lastContactedDate = toDateValue(input.lastContactedDate);
  const nextFollowUp = toDateValue(input.nextFollowUp);

  const result = await db
    .insert(leads)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      area: input.area,
      community: input.community,
      address: input.address,
      guardianName: input.guardianName,
      age: input.age,
      expectedBudget: input.expectedBudget ?? 0,
      numberOfContactAttempts: input.numberOfContactAttempts ?? 0,
      lastContactedDate,
      nextFollowUp,
      walkInDate: input.walkInDate,
      assignedTeacherId: input.assignedTeacherId,
      demoDate: input.demoDate,
      demoConducted: input.demoConducted ?? false,
      interest: input.interest,
      source: input.source,
      stageId: input.stageId!,
      ownerId: input.ownerId,
      notes: input.notes,
      followUpDate: input.followUpDate,
      followUpStatus: input.followUpStatus ?? "open"
    })
    .returning();

  return result[0];
}

export async function updateLead(id: string, patch: LeadUpdateInput) {
  const updates = {
    firstName: patch.firstName,
    lastName: patch.lastName,
    phone: patch.phone,
    email: patch.email,
    area: patch.area,
    community: patch.community,
    address: patch.address,
    guardianName: patch.guardianName,
    age: patch.age,
    expectedBudget: patch.expectedBudget,
    numberOfContactAttempts: patch.numberOfContactAttempts,
    lastContactedDate: patch.lastContactedDate
      ? toDateValue(patch.lastContactedDate)
      : undefined,
    nextFollowUp: patch.nextFollowUp ? toDateValue(patch.nextFollowUp) : undefined,
    walkInDate: patch.walkInDate,
    assignedTeacherId: patch.assignedTeacherId,
    demoDate: patch.demoDate,
    demoConducted: patch.demoConducted,
    interest: patch.interest,
    source: patch.source,
    stageId: patch.stageId,
    ownerId: patch.ownerId,
    notes: patch.notes,
    followUpDate: patch.followUpDate,
    followUpStatus: patch.followUpStatus,
    updatedAt: new Date()
  };

  const result = await db
    .update(leads)
    .set(updates)
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function updateLeadWorkflow(id: string, patch: LeadWorkflowPatchInput) {
  const result = await db
    .update(leads)
    .set({
      stageId: patch.stageId,
      ownerId: patch.ownerId,
      assignedTeacherId: patch.assignedTeacherId,
      walkInDate:
        patch.walkInDate === undefined
          ? undefined
          : patch.walkInDate === null
            ? null
            : patch.walkInDate,
      followUpDate: patch.followUpDate,
      nextFollowUp:
        patch.nextFollowUp === undefined
          ? undefined
          : patch.nextFollowUp === null
            ? null
            : toDateValue(patch.nextFollowUp),
      demoDate:
        patch.demoDate === undefined
          ? undefined
          : patch.demoDate === null
            ? null
            : patch.demoDate,
      demoConducted: patch.demoConducted,
      numberOfContactAttempts: patch.numberOfContactAttempts,
      lastContactedDate:
        patch.lastContactedDate === undefined
          ? undefined
          : patch.lastContactedDate === null
            ? null
            : toDateValue(patch.lastContactedDate),
      updatedAt: new Date()
    })
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function updateLeadProfile(id: string, patch: LeadProfilePatchInput) {
  const result = await db
    .update(leads)
    .set({
      ...patch,
      updatedAt: new Date()
    })
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function softDeleteLead(id: string) {
  const result = await db
    .update(leads)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .returning();

  return result[0] ?? null;
}

export async function hardDeleteLead(id: string) {
  const result = await db
    .delete(leads)
    .where(eq(leads.id, id))
    .returning();

  return result[0] ?? null;
}

export async function insertLeadNotes(leadId: string, body: string, createdBy: string) {
  const result = await db.insert(leadNotes).values({ leadId, body, createdBy }).returning();
  return result[0];
}

export async function listLeadNotes(leadId: string) {
  const result = await db
    .select({
      id: leadNotes.id,
      leadId: leadNotes.leadId,
      body: leadNotes.body,
      createdAt: leadNotes.createdAt,
      createdBy: leadNotes.createdBy,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userRole: users.role
    })
    .from(leadNotes)
    .innerJoin(users, eq(leadNotes.createdBy, users.id))
    .where(eq(leadNotes.leadId, leadId))
    .orderBy(asc(leadNotes.createdAt));

  return result;
}

export async function listLeadHistory(leadId: string) {
  const result = await db
    .select({
      id: leadAuditEvents.id,
      leadId: leadAuditEvents.leadId,
      eventType: leadAuditEvents.eventType,
      meta: leadAuditEvents.meta,
      createdAt: leadAuditEvents.createdAt,
      createdBy: leadAuditEvents.createdBy,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userRole: users.role
    })
    .from(leadAuditEvents)
    .innerJoin(users, eq(leadAuditEvents.createdBy, users.id))
    .where(eq(leadAuditEvents.leadId, leadId))
    .orderBy(desc(leadAuditEvents.createdAt));

  return result;
}

export async function listLeadTags(leadId: string) {
  return db.select().from(leadTags).where(eq(leadTags.leadId, leadId)).orderBy(asc(leadTags.createdAt));
}

export async function replaceLeadTags(leadId: string, tags: string[], createdBy: string) {
  await db.delete(leadTags).where(eq(leadTags.leadId, leadId));

  if (tags.length === 0) {
    return [];
  }

  const normalized = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  const inserted = await db
    .insert(leadTags)
    .values(normalized.map((label) => ({ leadId, label, createdBy })))
    .returning();

  return inserted;
}

export async function insertLeadAuditEvent(input: {
  leadId: string;
  eventType: string;
  meta?: Record<string, unknown>;
  createdBy: string;
}) {
  const result = await db
    .insert(leadAuditEvents)
    .values({
      leadId: input.leadId,
      eventType: input.eventType,
      meta: input.meta ?? {},
      createdBy: input.createdBy
    })
    .returning();
  return result[0];
}

export async function listStaffLoadCounts(staffIds: string[]) {
  if (staffIds.length === 0) {
    return [];
  }

  return db
    .select({ ownerId: leads.ownerId, count: sql<number>`count(*)` })
    .from(leads)
    .where(and(isNull(leads.deletedAt), inArray(leads.ownerId, staffIds)))
    .groupBy(leads.ownerId);
}

export async function getLeadAlertSummary(leadId: string) {
  const lead = await getLeadById(leadId);
  if (!lead) {
    return [] as Array<{ id: string; severity: "info" | "warning" | "critical"; message: string }>;
  }

  const alerts: Array<{ id: string; severity: "info" | "warning" | "critical"; message: string }> = [];
  const now = new Date();
  const followUp = lead.nextFollowUp ? new Date(lead.nextFollowUp) : new Date(`${lead.followUpDate}T00:00:00.000Z`);

  if (!Number.isNaN(followUp.getTime()) && followUp.getTime() < now.getTime()) {
    alerts.push({
      id: "missed-followup",
      severity: "critical",
      message: "Follow-up is overdue. Please call and update status."
    });
  }

  if (lead.walkInDate) {
    const walkIn = new Date(`${lead.walkInDate}T00:00:00.000Z`);
    const diff = walkIn.getTime() - now.getTime();
    if (diff > 0 && diff <= 48 * 60 * 60 * 1000) {
      alerts.push({
        id: "walkin-nearing",
        severity: "warning",
        message: "Walk-in date is within 48 hours. Confirm teacher availability."
      });
    }
  }

  if (lead.demoConducted && !lead.demoDate) {
    alerts.push({
      id: "missing-demo-date",
      severity: "warning",
      message: "Demo marked conducted but demo date is missing."
    });
  }

  return alerts;
}
