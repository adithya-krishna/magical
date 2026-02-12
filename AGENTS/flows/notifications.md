# Notifications Flow

This document defines key notification triggers, routing, and example payloads for the in-app notification system.

## Channels (v1)
- In-app only.
- Email/SMS/push are out of scope but reserved in the model.

## Flow A: Lead follow-up due
Trigger
- Lead has a followUpDate that is due today or overdue and is not in an onboarded stage.
Recipients
- Lead owner (staff/admin)
- Admins (optional summary or single alert per owner)
Notification example
- type: lead_followup_due
- title: Lead follow-up due
- body: Follow up with Priya Shah (Piano) by today.
- entityType: lead
- entityId: <leadId>
- ctaUrl: /leads?leadId=<leadId>

## Flow B: Admission blocked by capacity
Trigger
- Admission creation fails because at least one selected slot is at capacity.
Recipients
- Staff/admin creating the admission
- Admins (optional escalation if repeated)
Notification example
- type: admission_blocked_capacity
- title: Admission blocked
- body: Tue 16:00 Piano is full. Choose another slot.
- entityType: admission
- entityId: <tempAdmissionId>
- ctaUrl: /admissions/new?leadId=<leadId>

## Flow C: Student reschedule request
Trigger
- Student requests a change for a future class date.
Recipients
- Admins
- Assigned teacher
Notification example
- type: reschedule_requested
- title: Reschedule request
- body: Arjun Mehta requests a change for Fri 17:00.
- entityType: attendance
- entityId: <attendanceId>
- ctaUrl: /classroom?slotId=<slotId>

## Flow D: Reschedule approved/rejected
Trigger
- Admin approves or rejects a reschedule request.
Recipients
- Student
- Assigned teacher
Notification example
- type: reschedule_result
- title: Reschedule approved
- body: Your class was moved to Sun 18:00.
- entityType: attendance
- entityId: <attendanceId>
- ctaUrl: /students/<studentId>/attendance

## Flow E: Classes remaining = 4
Trigger
- Remaining class count reaches 4.
Recipients
- Student
- Admins
Notification example
- type: classes_remaining_4
- title: Classes remaining
- body: 4 classes left in your plan. Renewal due soon.
- entityType: admission
- entityId: <admissionId>
- ctaUrl: /admissions/<admissionId>

## Flow F: Classes remaining = 0
Trigger
- Remaining class count reaches 0.
Recipients
- Admins
Notification example
- type: classes_completed
- title: Plan completed
- body: Arjun Mehta has completed all classes. Review renewal.
- entityType: admission
- entityId: <admissionId>
- ctaUrl: /admissions/<admissionId>

## Flow G: Broadcast announcement
Trigger
- Admin or super_admin sends a broadcast notification.
Recipients
- Targeted roles or all users.
Notification example
- type: broadcast
- title: Holiday schedule
- body: School is closed on Monday.
- entityType: system
- entityId: <broadcastId>
- ctaUrl: /
