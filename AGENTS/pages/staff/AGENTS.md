# Users > Staff Page AGENT

## Goal
Manage staff users and their profiles. Provide attendance tracking.

## Access (RBAC)
- Staff list: super_admin, admin.
- Staff detail pages (profile/attendance): super_admin, admin.
- Staff can access their own staff pages in read-only mode.

## UI scope
- Staff list with search, filters, pagination.
- Row click opens Staff profile page.
- Staff sub-tabs:
  - Profile
  - Attendance

## Data model (suggested)
StaffProfile
- id (uuid)
- userId (uuid)
- department (string, optional)
- hireDate (date, optional)
- notes (text, optional)

StaffAttendance
- id (uuid)
- staffId (uuid)
- workDate (date)
- status (enum: present, absent, late, excused)
- notes (text, optional)

## Filters and sorting
- Search by name, email, phone.
- Filter by status (active/inactive), department, hire date range.
- Sort by createdAt (default desc), lastName.

## API endpoints (v1)
Staff list
- GET `/api/v1/staff` with pagination and filters
- GET `/api/v1/staff/:id`
- PATCH `/api/v1/staff/:id` (profile updates)

Staff attendance
- GET `/api/v1/staff/:id/attendance`
- POST `/api/v1/staff/:id/attendance`
- PATCH `/api/v1/staff/:id/attendance/:attendanceId`
- DELETE `/api/v1/staff/:id/attendance/:attendanceId`

## Validation rules
- Staff records must map to a User with role=staff.
- Attendance dates cannot be in the future.

## FE behaviors
- Users accordion renders Staff based on role.
- Staff detail pages use tabs and keep URL state in sub-routes.
