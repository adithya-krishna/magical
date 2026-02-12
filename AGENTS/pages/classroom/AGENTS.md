# Classroom Page AGENT

## Goal
Display active classes by time slot, show occupancy, and allow attendance marking. Classroom slots are configured by admins and used for automatic student assignment at admission time.

## Access (RBAC)
- Allowed roles: super_admin, admin.
- View-only: staff.
- Forbidden roles: teacher, student.

## UI scope
- Day selector (default Tue-Sun) and slot navigation.
- Classroom cards grouped by time slot.
- Each card shows course, teacher, occupancy, and capacity.
- Card click opens a sheet to mark attendance and manage enrollments.
- Add student to slot via combo box filtered by course + teacher.

## Default configuration (v1)
- Operating days: Tue-Sun (Mon closed)
- Slot duration: 60 minutes
- Daily slots: 6 slots from 15:00 to 21:00
- Admin can reconfigure operating days and slot templates.

## Data model (suggested)
OperatingDay
- id (uuid)
- dayOfWeek (int 0-6)
- isOpen (boolean)

TimeSlotTemplate
- id (uuid)
- dayOfWeek (int 0-6)
- startTime (time)
- endTime (time)
- durationMinutes (int)
- isActive (boolean)

ClassroomSlot
- id (uuid)
- timeSlotId (uuid)
- courseId (uuid)
- teacherId (uuid)
- capacity (int)
- isActive (boolean)

ClassroomEnrollment
- id (uuid)
- studentId (uuid)
- classroomSlotId (uuid)
- startDate (date)
- status (enum: active, paused, ended)

Attendance
- id (uuid)
- studentId (uuid)
- classroomSlotId (uuid)
- classDate (date)
- status (enum: scheduled, present, absent, late, excused)
- updatedBy (uuid)
- updatedAt

RescheduleRequest
- id (uuid)
- studentId (uuid)
- originalAttendanceId (uuid)
- requestedDate (date)
- requestedSlotId (uuid, optional)
- status (enum: pending, approved, rejected)
- createdAt, updatedAt

## Automatic assignment (must be enforced)
- Performed during admission creation.
- Inputs: course, plan duration, weekly slots (day/time), start date.
- For each selected slot:
  - day must be open
  - time slot must exist
  - ClassroomSlot must exist for course + time
  - capacity must be available
- If any selected slot is full, block admission and return a slot-specific error.
- Teacher is fixed by the ClassroomSlot (no load balancing in v1).
- Create ClassroomEnrollment for each selected slot.
- Pre-generate Attendance rows for every class date in the plan.

## Attendance and rescheduling
- Attendance rows are pre-generated at admission time.
- Student can request changes for future dates.
- Admin approves based on capacity and same course + teacher.
- Admin can also reschedule directly to any day/slot with same course + teacher.

## Backend implementation notes
- Reschedule applies to a single class date (no bulk changes).
- Capacity checks use active ClassroomEnrollment only.
- Reschedule target must match course + teacher.
- See notifications system for alert routing.

## Filters and sorting
- Filter by day, course, teacher, occupancy range.
- Sort by time slot order and course.

## API endpoints (v1)
Operating days and slots
- GET `/api/v1/operating-days`
- PATCH `/api/v1/operating-days` (admin+)
- GET `/api/v1/time-slots?day=...`
- POST `/api/v1/time-slots` (admin+)
- PATCH `/api/v1/time-slots/:id` (admin+)
- DELETE `/api/v1/time-slots/:id` (admin+)

Classroom slots and dashboard
- GET `/api/v1/classroom-slots?day=...`
- POST `/api/v1/classroom-slots` (admin+)
- PATCH `/api/v1/classroom-slots/:id` (admin+)
- DELETE `/api/v1/classroom-slots/:id` (admin+)
- GET `/api/v1/classroom-dashboard?day=...` (slots + occupancy + teacher/course summary)

Attendance
- GET `/api/v1/classrooms/:slotId/attendance?date=...`
- POST `/api/v1/classrooms/:slotId/attendance`
- PATCH `/api/v1/classrooms/:slotId/attendance/:attendanceId`

Rescheduling
- POST `/api/v1/reschedule-requests` (student)
- GET `/api/v1/reschedule-requests?status=pending`
- PATCH `/api/v1/reschedule-requests/:id` (approve/reject)

Assignment helpers
- GET `/api/v1/students?courseId=...&teacherId=...` (combo box filter)
- POST `/api/v1/classroom-assignments` (admin add student)

Notifications
- GET `/api/v1/notifications`
- PATCH `/api/v1/notifications/:id` (mark read)

## Validation rules
- Capacity cannot be exceeded at admission or admin assignment time.
- Reschedule target must match course + teacher.
- Attendance date must be within plan duration.
- Operating day must be open for any assigned slot.

## FE behaviors
- Load operating days and time slots before rendering.
- Cards display occupancy as filled indicators up to capacity.
- Card sheet shows attendance list with quick status toggles.
- When remaining classes = 4, show in-app alert.
- When remaining classes = 0, prompt admin to complete or remove.

## Notes
- See `AGENTS/flows/classroom-assignment.md` for the end-to-end flow.
