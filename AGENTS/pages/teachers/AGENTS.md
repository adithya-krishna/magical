# Users > Teachers/Instructors Page AGENT

## Goal
Manage teacher/instructor users and their profiles. Provide attendance tracking and future scheduling visibility.

## Access (RBAC)
- Teachers list: super_admin, admin, staff.
- Teacher detail pages (profile/attendance): super_admin, admin, staff.
- Teachers can access their own teacher pages in read-only mode.

## UI scope
- Teachers list with search, filters, pagination.
- Row click opens Teacher profile page.
- Teacher sub-tabs:
  - Profile
  - Attendance

## Data model (suggested)
TeacherProfile
- id (uuid)
- userId (uuid)
- primaryInstrument (string, optional)
- secondaryInstruments (string[], optional)
- hireDate (date, optional)
- hourlyRate (numeric, optional)
- bio (text, optional)
- notes (text, optional)

TeacherAttendance
- id (uuid)
- teacherId (uuid)
- classDate (date)
- status (enum: present, absent, late, excused)
- notes (text, optional)

## Filters and sorting
- Search by name, email, phone.
- Filter by status (active/inactive), instrument, hire date range.
- Sort by createdAt (default desc), lastName.

## API endpoints (v1)
Teachers list
- GET `/api/v1/teachers` with pagination and filters
- GET `/api/v1/teachers/:id`
- PATCH `/api/v1/teachers/:id` (profile updates)

Teacher attendance
- GET `/api/v1/teachers/:id/attendance`
- POST `/api/v1/teachers/:id/attendance`
- PATCH `/api/v1/teachers/:id/attendance/:attendanceId`
- DELETE `/api/v1/teachers/:id/attendance/:attendanceId`

## Validation rules
- Teacher records must map to a User with role=teacher.
- Attendance dates cannot be in the future.

## FE behaviors
- Users accordion renders Teachers based on role.
- Teacher detail pages use tabs and keep URL state in sub-routes.

## Notes
- Scheduling visibility will be handled in the Schedule module later.
