# Leads Page AGENT

## Goal
Capture, qualify, and progress inbound leads through phone validation, walk-in scheduling, demo tracking, and admission conversion.

## Access (RBAC)
- Allowed roles: super_admin, admin, staff, teacher.
- Forbidden role: student.
- super_admin/admin: full lead access (list/details/edit/workflow/tags/history/notes).
- staff: can view all leads, can mutate only leads they own.
- teacher: can view only leads assigned to them (`assignedTeacherId = teacher.id`) and can add notes only.

## Lifecycle workflow (required)
1. Lead is captured from source (social, referral, walk-in, etc.).
2. System auto-assigns a staff member (round-robin over active staff).
3. Stage defaults to `Due for validation` (fallback `New` when missing).
4. Staff performs manual call attempts.
5. If lead agrees to walk in:
   - set `walkInDate`
   - assign `assignedTeacherId`
   - set stage to `Walkin Expected`.
6. If staff cannot answer queries, reassign owner to admin via assignee control.
7. Teacher conducts demo and may add requirements in notes.
8. Staff marks `demoConducted` and `demoDate`.

## UI scope
- Leads listing page with pagination, search, status filters.
- Lead details CRM panel with tabs:
  - `Follow-up`: searchable notes chat, stage choice cards, assignee/teacher/date/demo workflow controls.
  - `History`: immutable timeline of all lead changes.
  - `Edit`: profile fields (address, guardian, phone/email, area/community, budget, etc.).
- Right-side profile section includes avatar, create-admission CTA, profile summary, tags, and lead-specific alerts.

## Data model (current target)
Lead
- id (uuid)
- firstName, lastName, phone, email
- area, community, address, guardianName, age
- expectedBudget (int)
- interest, source
- ownerId (staff/admin), assignedTeacherId (teacher)
- stageId
- followUpDate (date), followUpStatus (open|done)
- nextFollowUp (timestamp), walkInDate (date)
- numberOfContactAttempts (int), lastContactedDate (timestamp)
- demoDate (date), demoConducted (boolean)
- notes (profile notes)
- createdAt, updatedAt, deletedAt

LeadNote
- id, leadId, body, createdBy, createdAt

LeadTag
- id, leadId, label, createdBy, createdAt

LeadAuditEvent
- id, leadId, eventType, meta (json), createdBy, createdAt

## Audit and history rules (strict)
- All write actions MUST create audit events, including:
  - created, updated, profile_updated, workflow_updated
  - stage_changed, owner_changed, tags_updated, note_added, deleted, bulk_imported
- History API is the source of truth for change timeline.
- `meta` should include before/after values where possible.

## Alerts (lead-specific)
- Missed follow-up: `nextFollowUp` (or `followUpDate`) is in the past.
- Nearing walk-in: `walkInDate` is within 48 hours.
- Data consistency warning: demo conducted but demo date missing.

## API endpoints (v1)
Leads
- GET `/api/v1/leads`
- GET `/api/v1/leads/:id`
- GET `/api/v1/leads/:id/details`
- POST `/api/v1/leads`
- PATCH `/api/v1/leads/:id`
- PATCH `/api/v1/leads/:id/workflow`
- PATCH `/api/v1/leads/:id/profile`
- DELETE `/api/v1/leads/:id`

Notes, tags, history
- GET `/api/v1/leads/:id/notes`
- POST `/api/v1/leads/:id/notes`
- GET `/api/v1/leads/:id/history`
- PUT `/api/v1/leads/:id/tags`

Bulk
- POST `/api/v1/leads/bulk`
- GET `/api/v1/leads/template`

Lead stages
- GET `/api/v1/lead-stages`
- POST `/api/v1/lead-stages` (admin+)
- PATCH `/api/v1/lead-stages/:id` (admin+)
- DELETE `/api/v1/lead-stages/:id` (admin+)

Lookup APIs
- GET `/api/v1/users?roles=staff`
- GET `/api/v1/users?roles=teacher`

## Validation rules
- phone required and normalized server-side.
- followUpDate cannot be in the past.
- stageId must point to active stage.
- ownerId must be admin/staff.
- assignedTeacherId must be teacher.
- expectedBudget >= 0.
- numberOfContactAttempts >= 0.

## Notification rules
- On teacher assignment for walk-in, notify assigned teacher.
- Follow-up status updates can notify admins/super_admins.

## Notes
- Keep admissions creation separate but reachable via CTA from lead details.
- Attachments are out of scope for current iteration.
