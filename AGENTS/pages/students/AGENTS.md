# Users > Students Page AGENT

## Goal
Provide a Students sub-page under a Users accordion. Users is a catch-all for all personnel; Students is a dedicated list with profile, attendance, and progress views.

## Navigation behavior
- Sidebar item: Users.
- Clicking Users expands an accordion menu.
- Items visible by role:
  - super_admin: Students, Teachers/Instructors, Staff, Admins
  - admin: Students, Teachers/Instructors, Staff
  - staff/teacher/student: Students, Teachers/Instructors, Staff (no Admins)

## Access (RBAC)
- Students list: super_admin, admin, staff.
- Student detail pages (profile/attendance/progress): super_admin, admin, staff.
- Students can access their own student pages in read-only mode.

## UI scope
- Students list with search, filters, pagination.
- Row click opens Student profile page.
- Student sub-tabs:
  - Profile
  - Attendance
  - Progress
  - Reschedule Requests (read-only for students)

## Data model (suggested)
User (shared for all roles)
- id (uuid)
- role (enum: super_admin, admin, staff, teacher, student)
- firstName, lastName
- email (unique)
- phone (optional)
- isActive (boolean)
- createdAt, updatedAt

StudentProfile
- id (uuid)
- userId (uuid)
- admissionId (uuid, optional)
- primaryInstrument (string, optional)
- startDate (date, optional)
- guardianName (string, optional)
- guardianPhone (string, optional)
- notes (text, optional)

StudentProgress
- id (uuid)
- studentId (uuid)
- skillArea (string)
- level (string)
- notes (text)
- updatedAt

StudentAttendance
- id (uuid)
- studentId (uuid)
- classDate (date)
- classroomSlotId (uuid)
- status (enum: scheduled, present, absent, late, excused)
- notes (text, optional)

RescheduleRequest
- id (uuid)
- studentId (uuid)
- originalAttendanceId (uuid)
- requestedDate (date)
- requestedSlotId (uuid, optional)
- status (enum: pending, approved, rejected)
- createdAt, updatedAt

## Filters and sorting
- Search by name, email, phone.
- Filter by status (active/inactive), instrument, start date range.
- Sort by createdAt (default desc), lastName.

## API endpoints (v1)
Students list
- GET `/api/v1/students` with pagination and filters
- GET `/api/v1/students/:id`
- PATCH `/api/v1/students/:id` (profile updates)

Student attendance
- GET `/api/v1/students/:id/attendance`
- POST `/api/v1/students/:id/attendance`
- PATCH `/api/v1/students/:id/attendance/:attendanceId`
- DELETE `/api/v1/students/:id/attendance/:attendanceId`

Reschedule requests
- POST `/api/v1/reschedule-requests` (student)
- GET `/api/v1/reschedule-requests?studentId=...`

Student progress
- GET `/api/v1/students/:id/progress`
- POST `/api/v1/students/:id/progress`
- PATCH `/api/v1/students/:id/progress/:progressId`
- DELETE `/api/v1/students/:id/progress/:progressId`

## Validation rules
- Student records must map to a User with role=student.
- Future attendance dates are allowed only when status=scheduled.
- Non-scheduled statuses require classDate to be today or earlier.
- Progress entries require skillArea and level.
- Reschedule requests must target future attendance dates.

## FE behaviors
- Users accordion renders items based on role.
- Students list is a separate route under Users.
- Student detail pages use tabs and keep URL state in sub-routes.
- Attendance timeline shows future and past classes (pre-generated).
- Students can request reschedule for future classes; admin must approve.

## Notes
- Teachers, Staff, and Admins will have parallel page agents later.
