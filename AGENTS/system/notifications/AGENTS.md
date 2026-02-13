# Notifications System AGENT

## Goal
Provide a centralized, in-app notification system that supports reminders, workflow alerts, and broadcast announcements across the app.

## Scope
- In-app notifications only for v1.
- Support event-driven and scheduled notifications.
- Allow role-based routing and entity deep links.

## Access (RBAC)
- All users can read their own notifications.
- Admin and super_admin can create broadcasts.
- Notification creation is server-only (no direct client write).

## Data model (suggested)
Notification
- id (uuid)
- recipientUserId (uuid)
- type (string)
- title (string)
- body (string)
- severity (enum: info, warning, critical)
- entityType (enum: lead, admission, student, classroom, attendance, payment, system)
- entityId (uuid, optional)
- ctaUrl (string, optional)
- metadata (json, optional)
- createdAt (timestamp)
- readAt (timestamp, nullable)
- archivedAt (timestamp, nullable)
- expiresAt (timestamp, nullable)

NotificationEvent (source-of-truth log)
- id (uuid)
- eventType (string)
- entityType (string)
- entityId (uuid, optional)
- payload (json)
- createdAt (timestamp)

NotificationPreference (future-ready)
- id (uuid)
- userId (uuid)
- type (string)
- channel (enum: in_app, email, sms, push)
- enabled (boolean)

NotificationDelivery (future-ready)
- id (uuid)
- notificationId (uuid)
- channel (enum: in_app, email, sms, push)
- status (enum: queued, sent, failed)
- attempts (int)
- lastAttemptAt (timestamp)

## Notification catalog (v1)
Leads
- lead_followup_due
- lead_followup_status_changed
- lead_assigned
- lead_stage_changed
- lead_walkin_assigned

Admissions
- admission_created
- admission_blocked_capacity
- classes_remaining_4
- classes_completed

Classroom and attendance
- reschedule_requested
- reschedule_result
- attendance_missing

Users and access
- access_request_submitted
- access_request_approved
- access_request_rejected
- role_changed
- account_blocked

Payments (future)
- invoice_generated
- payment_received
- payment_overdue

System
- broadcast
- schedule_change
- closure_announcement

## Trigger rules
Event-driven
- On lead assignment, stage change, follow-up date updates.
- On lead teacher assignment for walk-in.
- On admission creation or capacity block.
- On reschedule request creation and approval/rejection.
- On role or access changes.
- On access request submission and approval/rejection.

Scheduled jobs
- Daily job: lead follow-up due today or overdue based on followUpDate.
- Daily job: remaining classes reaches 4.
- Daily job: remaining classes reaches 0.
- Optional: attendance not marked within 24 hours of class.

## Routing rules
- Lead follow-up alerts go to lead owner and admins.
- Lead walk-in teacher assignment goes to the assigned teacher.
- Reschedule requests go to admin and assigned teacher.
- Reschedule results go to student and assigned teacher.
- Classes remaining alerts go to student and admins.
- Broadcasts target specific roles or all users.

## Deduplication
- Prevent duplicate notifications for the same entity and type within 24 hours.
- Batch similar alerts when possible (e.g., 3 leads need follow-up).

## Backend implementation notes
- Enforce dedup with a unique constraint on (recipientUserId, type, entityId, date_trunc('day', createdAt)).

## API endpoints (v1)
- GET `/api/v1/notifications?status=unread|all&limit=25&cursor=...`
- GET `/api/v1/notifications/unread-count`
- PATCH `/api/v1/notifications/:id` (mark read)
- POST `/api/v1/notifications/mark-all-read`
- POST `/api/v1/notifications/broadcast` (admin+)

Preferences (future)
- GET `/api/v1/notification-preferences`
- PATCH `/api/v1/notification-preferences`

## FE behaviors
- Bell icon with unread count.
- Notifications list sorted by newest first.
- Clicking a notification navigates to ctaUrl.
- Support mark-as-read and mark-all-read.

## Audit
- All notification creation should log a NotificationEvent.
- Broadcast creation must be auditable by admin/super_admin.

## Notes
- See `AGENTS/flows/notifications.md` for end-to-end flows and examples.
