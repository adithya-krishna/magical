# AGENTS

This repo is a TurboRepo monorepo for a music school dashboard.

Stack (TypeScript end-to-end):
- Backend: Node.js + Express + Postgres (Drizzle)
- Frontend: React + Vite + TanStack Router + shadcn/ui
- Auth: Better Auth

Opinionated build order (for a fast, stable bootstrap):
1. Backend data model + API for Leads (first core workflow, informs RBAC).
2. Frontend Leads page consuming those APIs.
3. Repeat page-by-page.

Why: Leads is the intake source for students; its schema and RBAC shape the rest of the system. Locking the API early minimizes rework.

## How to use these docs
Each page has a dedicated AGENTS file with:
- UI behaviors, data requirements, and validations
- RBAC rules for access
- Required API endpoints to support the UI
- Suggested DB entities (for later backend work)

Global rules (applies to all pages):
- RBAC: Super Admin has full access. Admin has high access. Staff/Teacher/Student have limited access.
- All APIs must enforce RBAC server-side.
- Audit important changes (ownership, stage/status changes) with minimal event logs.
- Favor simple, explicit CRUD endpoints; keep pagination consistent.

## Page agents
- Leads: `AGENTS/pages/leads/AGENTS.md`
- Admissions: `AGENTS/pages/admissions/AGENTS.md`
- Students: `AGENTS/pages/students/AGENTS.md`
- Teachers: `AGENTS/pages/teachers/AGENTS.md`
- Staff: `AGENTS/pages/staff/AGENTS.md`
- Admins: `AGENTS/pages/admins/AGENTS.md`
- Classroom: `AGENTS/pages/classroom/AGENTS.md`
- Courses: `AGENTS/pages/courses/AGENTS.md`
- Settings: `AGENTS/pages/settings/AGENTS.md`

## Flow references
- Classroom assignment and attendance: `AGENTS/flows/classroom-assignment.md`
- Notifications: `AGENTS/flows/notifications.md`

## System agents
- Notifications: `AGENTS/system/notifications/AGENTS.md`

## System docs
- Database relationships: `AGENTS/system/database/RELATIONSHIPS.md`
- Database mock schema: `AGENTS/system/database/mock.sql`

## Conventions (recommended)
- Monorepo layout (suggested):
  - `apps/api` (Express + Drizzle)
  - `apps/web` (React + Vite + TanStack Router)
- Package manager: pnpm (TurboRepo tasks at root)
- API versioning: `/api/v1/...`
- Pagination: `?page=1&pageSize=25` with `total` in response.
- Filtering: use query params, keep names consistent across pages.
- IDs: UUIDs for user-facing entities.

## Backend implementation notes
- Organize Express routers by domain (leads, admissions, classroom, notifications, users).
- Use Zod schemas for request validation and response shaping.
- Enforce RBAC via middleware plus record-level checks (ownership for staff).
- Wrap admission creation, classroom assignment, and attendance pre-generation in a single DB transaction.
- Use a lightweight job runner or cron process for scheduled notifications.
- Use Drizzle ORM with schema in `apps/api/src/db/schema` and migrations under `apps/api/drizzle`.

## Auth/RBAC baseline
- Better Auth handles sessions and user identity.
- Roles: super_admin, admin, staff, teacher, student.
- Default super_admin created via seed script.
- Admin can manage staff/teacher/student profiles and access.
- Super_admin can manage admin profiles and system settings.
- Self-signup is disabled. Users must submit an access request and wait for super_admin approval before they can log in.

If any page needs divergence from these global rules, specify it in that page’s AGENTS file.
