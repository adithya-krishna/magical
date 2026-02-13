# Users > Admins Page AGENT

## Goal
Manage admin users. Only super_admin can access this area.

## Access (RBAC)
- Admins list: super_admin only.
- Admin detail pages (profile/attendance): super_admin only.
- Admins can access their own admin pages in read-only mode.

## UI scope
- Admins list with search, filters, pagination.
- Row click opens Admin profile page.
- Admin sub-tabs:
  - Profile
  - Attendance

## Data model (suggested)
AdminProfile
- id (uuid)
- userId (uuid)
- department (string, optional)
- notes (text, optional)

AdminAttendance
- id (uuid)
- adminId (uuid)
- workDate (date)
- status (enum: present, absent, late, excused)
- notes (text, optional)

## Filters and sorting
- Search by name, email, phone.
- Filter by status (active/inactive).
- Sort by createdAt (default desc), lastName.

## API endpoints (v1)
Admins list
- GET `/api/v1/admins` with pagination and filters
- GET `/api/v1/admins/:id`
- PATCH `/api/v1/admins/:id` (profile updates)

Admins attendance
- GET `/api/v1/admins/:id/attendance`
- POST `/api/v1/admins/:id/attendance`
- PATCH `/api/v1/admins/:id/attendance/:attendanceId`
- DELETE `/api/v1/admins/:id/attendance/:attendanceId`

## Validation rules
- Admin records must map to a User with role=admin.
- Attendance dates cannot be in the future.

## FE behaviors
- Users accordion renders Admins only for super_admin.
- Admin detail pages use tabs and keep URL state in sub-routes.

## Parity Notes
- Page-level RBAC is enforced as the source of truth for both API and UI visibility.
- Effective hierarchy is `admins > staff > teachers > students`.
- Admins list and admin management pages remain super_admin-only; admins can access only their own admin pages in read-only mode.
