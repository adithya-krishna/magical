# Courses Page AGENT

## Goal
Manage instruments and courses, including difficulty levels and teacher assignments. Courses are used during Admissions and Classroom assignment.

## Access (RBAC)
- Allowed roles: super_admin, admin.
- View-only: staff.
- Forbidden roles: teacher, student.

## UI scope
- Instruments list (create/edit/archive).
- Courses list with filters and pagination.
- Course detail with assigned teachers (multi-select).
- Difficulty level selection per course.

## Data model (suggested)
Instrument
- id (uuid)
- name (string, required, unique)
- isActive (boolean, default true)
- createdAt, updatedAt

Course
- id (uuid)
- instrumentId (uuid, required)
- name (string, required)
- difficulty (enum: beginner, intermediate, advanced)
- description (text, optional)
- isActive (boolean, default true)
- createdAt, updatedAt

CourseTeacher (many-to-many)
- id (uuid)
- courseId (uuid)
- teacherId (uuid)
- createdAt

## Filters and sorting
- Filter by instrument, difficulty, active status.
- Search by course name.
- Sort by instrument, difficulty, name.

## API endpoints (v1)
Instruments
- GET `/api/v1/instruments`
- POST `/api/v1/instruments` (admin+)
- PATCH `/api/v1/instruments/:id` (admin+)
- DELETE `/api/v1/instruments/:id` (soft delete preferred)

Courses
- GET `/api/v1/courses` with pagination and filters
- GET `/api/v1/courses/:id`
- POST `/api/v1/courses` (admin+)
- PATCH `/api/v1/courses/:id` (admin+)
- DELETE `/api/v1/courses/:id` (soft delete preferred)

Course teachers
- GET `/api/v1/courses/:id/teachers`
- POST `/api/v1/courses/:id/teachers` (admin+)
- DELETE `/api/v1/courses/:id/teachers/:teacherId` (admin+)

## Validation rules
- Course must reference an active instrument.
- Difficulty must be one of: beginner, intermediate, advanced.
- CourseTeacher must reference a user with role=teacher.

## FE behaviors
- Instruments and courses are managed in the same page (tabs or split layout).
- Course detail uses multi-select for teachers.
- Changes to course teacher assignments should update Classroom availability.

## Notes
- Admissions should only allow courses that are active.
