# Admissions Page AGENT

## Goal
Convert a lead into a student admission by selecting a course duration and creating an enrollment record. Admissions define the plan length, class count, discounts, and any additional classes purchased.

## Access (RBAC)
- Allowed roles: super_admin, admin, staff.
- Forbidden roles: teacher, student.
- Super_admin and admin can edit all admissions.
- Staff can create admissions from leads and edit admissions they created.

## UI scope
- Admissions list with filters and pagination.
- Create admission flow starting from a lead (either from Leads page or Admissions page).
- Edit admission details: duration plan, discount, extra classes, notes.
- Select weekly class slots (day/time) and start date.
- Show computed totals (base classes + extra classes - discount).

## Course duration (configurable, v1 defaults)
- 1 month = 8 classes
- 3 months = 24 classes
- 6 months = 48 classes
- 9 months = 72 classes
- 12 months (1 year) = 96 classes
- Assumption: 2 classes per week

## Data model (suggested)
Admission
- id (uuid)
- leadId (uuid, required)
- studentId (uuid, nullable until student profile is created)
- coursePlanId (uuid, required)
- courseId (uuid, required)
- startDate (date, required)
- weeklySlots (json, required) // list of day/time selections
- baseClasses (int, required) // from plan at time of admission
- extraClasses (int, default 0)
- discountType (enum: percent, amount, none)
- discountValue (numeric, default 0)
- finalClasses (int, derived) // baseClasses + extraClasses
- notes (text, optional)
- status (enum: pending, active, completed, cancelled)
- createdAt, updatedAt

CoursePlan
- id (uuid)
- name (string) // 1 month, 3 months, etc.
- durationMonths (int)
- classesPerWeek (int, default 2)
- totalClasses (int) // derived from durationMonths * 4 * classesPerWeek
- isActive (boolean, default true)

AdmissionAuditEvent
- id (uuid)
- admissionId (uuid)
- type (enum: created, updated, discount_changed, extra_classes_added, status_changed)
- meta (json)
- createdBy (uuid)
- createdAt

## Admissions workflow
- Admission can only be created from a lead in an onboarded stage.
- Once created, the lead is marked as onboarded (if not already).
- Optionally create a student profile immediately or defer.
- During creation, enforce classroom slot capacity (hard block on full slots).
- Auto-assign a fixed teacher and classroom slot per selected weekly slot.
- Pre-generate attendance dates for the full plan duration.

## Backend implementation notes
- Resolve weeklySlots by mapping day/time to TimeSlotTemplate, then to ClassroomSlot by courseId.
- Capacity check counts only active ClassroomEnrollment for that slot.
- Block admission if any selected slot is at capacity and return slot-specific error.
- Create Admission, ClassroomEnrollment, and Attendance rows in a single DB transaction.
- Remaining classes = finalClasses - count(attendance where status=present).

## Filters and sorting
- Filter by status, plan, created date, assigned owner.
- Sort by createdAt (default desc), updatedAt, status.

## Discounts and extra classes
- Extra classes are additive and cannot be negative.
- Discounts can be percent or fixed amount.
- Discounts never reduce class count; they only affect billing (tracked for later).

## API endpoints (v1)
Admissions
- GET `/api/v1/admissions` with pagination and filters
- GET `/api/v1/admissions/:id`
- POST `/api/v1/admissions`
- PATCH `/api/v1/admissions/:id`
- DELETE `/api/v1/admissions/:id` (soft delete preferred)

Course plans
- GET `/api/v1/course-plans`
- POST `/api/v1/course-plans` (admin+)
- PATCH `/api/v1/course-plans/:id` (admin+)
- DELETE `/api/v1/course-plans/:id` (admin+)

Lead linkage
- GET `/api/v1/leads?stage=isOnboarded` (for selection)

Classroom assignment (used during admission)
- GET `/api/v1/operating-days`
- GET `/api/v1/time-slots?day=...`
- GET `/api/v1/classroom-slots?day=...&courseId=...`

## Validation rules
- Admission must reference an existing lead.
- coursePlanId must be active.
- extraClasses >= 0.
- discountValue >= 0.
- If discountType is percent, 0-100.
- weeklySlots must include valid operating days and existing time slots.
- Block admission if any selected slot is at capacity.

## FE behaviors
- Admission create form pulls course plans and precomputes total classes.
- Admission create form requires weekly slot selection before submit.
- Show summary: base classes, extra classes, final classes.
- When admission is created, show a toast with quick link to Student profile creation.

## Seed data (recommended)
- Default course plans per v1 list.

## Notes
- Billing is out of scope for v1; discounts are recorded for future invoicing.
