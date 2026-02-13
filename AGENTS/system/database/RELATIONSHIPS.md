# Database Relationships and Interactions

This document describes how data is stored, the relationships between entities, and the key backend interactions for the music school dashboard. The schema targets Postgres and is optimized for the core workflows: Leads → Admissions → Classroom → Attendance → Notifications.

## Design principles
- Single school instance (no multi-tenant partitioning).
- UUID primary keys with `gen_random_uuid()`.
- Strict RBAC at the API layer; record-level checks for staff ownership.
- Transactions for admission creation and classroom assignment.
- Pre-generated attendance rows for the full plan duration.
- Minimal payment tracking with paid/unpaid status and notes.
- Soft delete for core entities using `deletedAt`.

## Core entities and relationships

Users and access
- `users` is the shared table for all roles (super_admin, admin, staff, teacher, student).
- `access_requests` tracks user access approval requests (requested before a user can log in).
- `access_requests` should store request identity fields (email, name, role), status, and review metadata; userId is set only after approval.
- `user_settings` stores per-user preferences.

Leads
- `leads.stageId` → `lead_stages.id` (required)
- `leads.ownerId` → `users.id` (nullable)
- `leads.assignedTeacherId` → `users.id` (nullable, role=teacher)
- `leads` also stores CRM workflow/profile fields: area, community, address, guardianName, age, expectedBudget, numberOfContactAttempts, lastContactedDate, nextFollowUp, walkInDate, demoDate, demoConducted.
- `lead_notes.leadId` → `leads.id`
- `lead_tags.leadId` → `leads.id`
- `lead_audit_events.leadId` → `leads.id`

Courses
- `courses.instrumentId` → `instruments.id`
- `course_teachers.courseId` → `courses.id`
- `course_teachers.teacherId` → `users.id` (role=teacher)

Admissions
- `admissions.leadId` → `leads.id`
- `admissions.studentId` → `users.id` (role=student)
- `admissions.courseId` → `courses.id`
- `admissions.coursePlanId` → `course_plans.id`
- `admission_slots.admissionId` → `admissions.id`
- `admission_slots.timeSlotId` → `time_slot_templates.id`
- `admission_payments.admissionId` → `admissions.id` (unique)

Classroom and scheduling
- `operating_days` defines which days are open.
- `time_slot_templates` defines available slots per day.
- `classroom_slots.timeSlotId` → `time_slot_templates.id`
- `classroom_slots.courseId` → `courses.id`
- `classroom_slots.teacherId` → `users.id` (role=teacher)
- `classroom_enrollments.studentId` → `users.id` (role=student)
- `classroom_enrollments.classroomSlotId` → `classroom_slots.id`
- `classroom_enrollments.admissionId` → `admissions.id`
- `attendance.studentId` → `users.id` (role=student)
- `attendance.classroomSlotId` → `classroom_slots.id`
- `reschedule_requests.originalAttendanceId` → `attendance.id`

Notifications
- `notifications.recipientUserId` → `users.id`
- `notification_events` stores the source-of-truth event log

## Key transactional flows

Admission creation (single transaction)
1. Validate weekly slot selections against `operating_days` and `time_slot_templates`.
2. Resolve each slot to a `classroom_slots` row by courseId + timeSlotId.
3. Capacity check uses **active** `classroom_enrollments` only.
4. If any slot is full, rollback and return slot-specific error.
5. Insert into `admissions`, `admission_slots`, and `classroom_enrollments`.
6. Pre-generate `attendance` rows for each class date in the plan.

Classroom dashboard
- Join `time_slot_templates` + `classroom_slots` + `courses` + `users` (teacher).
- Occupancy = count of active `classroom_enrollments` per classroom slot.

Reschedule request (single date only)
1. Student submits request for a future `attendance` row (status=scheduled).
2. Create `reschedule_requests` with status=pending.
3. Notify admin + teacher.
4. Admin approves: update the target attendance row to new date/slot.
5. Capacity check uses active enrollments only and course + teacher must match.

Notifications
- Event-driven: lead assignments, reschedule requests, admission create/block.
- Scheduled: followUpDate due, remaining classes = 4, remaining classes = 0.
- Dedup by (recipientUserId, type, entityId, day).

Payments (simple)
- `admission_payments` stores paid/unpaid status and notes.
- Admin toggles status; `updatedBy` and `updatedAt` track changes.

## Integrity constraints
- `classroom_enrollments` unique on (studentId, classroomSlotId) where status=active.
- `course_teachers` unique on (courseId, teacherId).
- `admission_payments` unique on (admissionId).
- `leads.followUpDate` required; `followUpStatus` must be open or done.

## Indexing strategy
- `leads(followUpDate, followUpStatus)` for daily follow-up queries.
- `classroom_enrollments(classroomSlotId, status)` for occupancy.
- `attendance(classroomSlotId, classDate)` for classroom views.
- `attendance(studentId, classDate)` for student timelines.
- `notifications(recipientUserId, readAt)` for unread counts.
- `reschedule_requests(status, createdAt)` for admin inbox.
