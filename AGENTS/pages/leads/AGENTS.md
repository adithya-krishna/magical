# Leads Page AGENT

## Goal
Capture, qualify, and manage inbound leads. The Leads page is the first core workflow and defines intake data used later by Admissions and Students.

## Access (RBAC)
- Allowed roles: super_admin, admin, staff.
- Forbidden roles: teacher, student.
- Super_admin and admin can edit all leads.
- Staff can edit leads they own; can view all leads.

## UI scope
- Default listing page with filters and pagination.
- Clicking a row opens a side panel with full lead details.
- Inline actions from list and panel: assign owner, change stage, add note.
- Bulk upload via CSV template with validation results.

## Data model (suggested)
Lead
- id (uuid)
- firstName (string, required)
- lastName (string, required)
- phone (string, required)
- email (string, optional)
- interest (string, optional) // instrument or course
- source (string, optional) // referral, ads, web, etc.
- stageId (uuid, required)
- ownerId (uuid, nullable)
- notes (text, optional)
- followUpDate (date, required)
- followUpStatus (enum: open, done)
- createdAt, updatedAt

LeadStage
- id (uuid)
- name (string, required, unique)
- order (int, required) // for pipeline ordering
- isOnboarded (boolean, default false) // marks final stage
- isActive (boolean, default true)

LeadNote (optional v1, can be simplified to a single notes field)
- id (uuid)
- leadId (uuid)
- body (text)
- createdBy (uuid)
- createdAt

LeadAuditEvent
- id (uuid)
- leadId (uuid)
- type (enum: created, updated, stage_changed, owner_changed, note_added, bulk_imported)
- meta (json)
- createdBy (uuid)
- createdAt

## Lead stages (dynamic)
- Stages are configurable by super_admin/admin.
- Use `isOnboarded=true` for the terminal stage (ex: Onboarded). This is used for filtering and future admissions triggers.
- Enforce at least one active stage.
- If the active stage is deleted, reassign to a fallback stage.

## Filters and sorting
- Search by name, phone, email.
- Filter by stage, owner, source, created date range.
- Filter by followUpDate range and followUpStatus.
- Sort by createdAt (default desc), updatedAt, stage order.

## Bulk upload (CSV)
- Provide a downloadable CSV template from the UI.
- Required columns: firstName, lastName, phone.
- Optional columns: email, interest, source, notes, followUpDate.
- Bulk import always assigns the default stage "New".
- Validate row-by-row; accept partial success with a summary of errors.
- On success, record a bulk_imported audit event per lead.

## API endpoints (v1)
Leads
- GET `/api/v1/leads` with pagination and filters
- GET `/api/v1/leads/:id`
- POST `/api/v1/leads`
- PATCH `/api/v1/leads/:id`
- DELETE `/api/v1/leads/:id` (soft delete preferred)
- POST `/api/v1/leads/bulk` (CSV upload)
- GET `/api/v1/leads/template` (CSV template)

Lead stages
- GET `/api/v1/lead-stages`
- POST `/api/v1/lead-stages` (admin+)
- PATCH `/api/v1/lead-stages/:id` (admin+)
- DELETE `/api/v1/lead-stages/:id` (admin+)

Users for assignment
- GET `/api/v1/users?roles=admin,staff` (minimal fields for assignment)

## Validation rules
- phone is required and normalized (E.164 stored, raw input accepted).
- email must be valid format when provided.
- stageId must refer to an active stage.
- ownerId must belong to admin or staff.
- followUpDate must be today or later.
- Prevent deleting a stage if it is the only active stage.

## FE behaviors
- Load stages and owners before rendering filters.
- Side panel uses optimistic updates for stage/owner changes with rollback on error.
- When stage changes to `isOnboarded`, show a non-blocking banner that admissions can be created later.
- Follow-up status changes notify admin and super_admin.

## Seed data (recommended)
- Default stages: New, Contacted, Trial Scheduled, Trial Completed, Onboarded (isOnboarded).

## Notes
- Admissions integration will come later; keep stage and lead ownership auditable for future workflow automation.
- Admissions may create system-generated leads for walk-in enrollments. Use a distinct source value (e.g. `walk_in`) and keep them in an onboarded stage.
- Scheduled job should emit lead_followup_due notifications for open leads with followUpDate due or overdue.
