import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { leadAuditEvents, leadNotes, leads } from "../db/schema";
import type { LeadCreateInput, LeadListFilters, LeadUpdateInput } from "./lead.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

export async function listLeads(
  filters: LeadListFilters,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE
) {
  const whereClauses = [isNull(leads.deletedAt)];

  if (filters.stageId) {
    whereClauses.push(eq(leads.stageId, filters.stageId));
  }
  if (filters.ownerId) {
    whereClauses.push(eq(leads.ownerId, filters.ownerId));
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
      ilike(leads.email, term)
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
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
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
  const result = await db
    .insert(leads)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      interest: input.interest,
      source: input.source,
      stageId: input.stageId,
      ownerId: input.ownerId,
      notes: input.notes,
      followUpDate: input.followUpDate,
      followUpStatus: input.followUpStatus ?? "open"
    })
    .returning();

  return result[0];
}

export async function updateLead(id: string, patch: LeadUpdateInput) {
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


export async function insertLeadNotes(
  leadId: string,
  body: string,
  createdBy: string
) {
  const result = await db
    .insert(leadNotes)
    .values({ leadId, body, createdBy })
    .returning();
  return result[0];
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
