# Codebase Review Tasks

Review scope: JS/TS backend + frontend implementation quality only (no flow docs).

Priority legend:
- P0 = critical correctness/stability
- P1 = high impact maintainability/architecture
- P2 = medium quality/perf/UX
- P3 = low priority hardening

## P0

1. **Fix Rules of Hooks violations (hooks called after conditional return)**
   - **Why:** This can cause runtime hook-order bugs when permissions/session state changes. React requires hooks to be called unconditionally at top level.
   - **Change:** Move all hooks above early returns and keep hook order stable on every render.
   - **Files:**
     - `apps/web/src/pages/users/users-list-page.tsx`
     - `apps/web/src/pages/users/user-detail-page.tsx`

2. **Add centralized Express async error handling for routes without local try/catch**
   - **Why:** In Express 4, rejected async handlers are not reliably captured unless forwarded to `next(err)`. This risks unhandled promise rejections and inconsistent API failures.
   - **Change:** Add async-handler wrapper and global error middleware; route handlers should call `next(err)` (or be wrapped) instead of relying on implicit behavior.
   - **Files:**
     - `apps/api/src/index.ts`
     - `apps/api/src/access-requests/access-request.routes.ts`
     - `apps/api/src/routes/users.ts`

## P1

3. **Break down oversized feature components into smaller modules**
   - **Why:** Large files currently mix data fetching, business rules, form orchestration, and large JSX trees; this reduces legibility and testability.
   - **Change:** Split into feature hooks + presentational sections + action handlers.
   - **Files:**
     - `apps/web/src/pages/classroom-page.tsx`
     - `apps/web/src/pages/admissions/admission-form-sheet.tsx`
     - `apps/web/src/pages/courses-page.tsx`
     - `apps/web/src/pages/leads-page.tsx`

4. **Create shared API client + feature query/mutation hooks (TanStack Query-first pattern)**
   - **Why:** Fetch boilerplate is duplicated across pages (`apiUrl`, credentials, error parsing, response handling), increasing inconsistency.
   - **Change:** Build `apiClient` + query key factory + per-feature hooks (`useLeadsQuery`, `useCoursesQuery`, etc.).
   - **Files:**
     - `apps/web/src/pages/leads-page.tsx`
     - `apps/web/src/pages/courses-page.tsx`
     - `apps/web/src/pages/instruments-page.tsx`
     - `apps/web/src/pages/admissions-page.tsx`
     - `apps/web/src/pages/classroom-page.tsx`
     - `apps/web/src/pages/users/users-list-page.tsx`
     - `apps/web/src/pages/users/user-detail-page.tsx`
     - `apps/web/src/pages/courses/course-plans-tab.tsx`
     - `apps/web/src/pages/admissions/admission-form-sheet.tsx`

5. **Convert request-access submit flow to TanStack Query mutation**
   - **Why:** This page uses ad-hoc fetch + local submit state while the app standard is Query. Using `useMutation` gives consistent retries, error state, and cache integration.
   - **Change:** Replace inline submit fetch with `useMutation` and shared API error parser.
   - **Files:**
     - `apps/web/src/pages/auth/request-access-page.tsx`

6. **Move component-local domain types/enums/constants into shared files**
   - **Why:** Several pages define role/status/domain types inline, increasing drift and violating separation of concerns.
   - **Change:** Extract to feature `types.ts` / `constants.ts` (or shared package) and reuse.
   - **Files:**
     - `apps/web/src/pages/classroom-page.tsx`
     - `apps/web/src/pages/admissions-page.tsx`
     - `apps/web/src/pages/auth/request-access-page.tsx`

7. **Extract table column definitions and table config from page components**
   - **Why:** Data table behavior/config mixed into page files makes components harder to read and maintain.
   - **Change:** Move `ColumnDef[]` and related cell renderers to dedicated files per feature.
   - **Files:**
     - `apps/web/src/pages/leads-page.tsx`
     - `apps/web/src/pages/courses-page.tsx`
     - `apps/web/src/pages/instruments-page.tsx`
     - `apps/web/src/pages/admissions-page.tsx`
     - `apps/web/src/pages/users/users-list-page.tsx`

8. **Centralize role/status/difficulty enums and remove scattered string literal unions**
   - **Why:** Same enum domains are duplicated across DB schema, Zod schemas, middleware, repos, and frontend types; drift risk is high.
   - **Change:** Define shared constant tuples/enums and derive Zod enums + TS types from them.
   - **Files:**
     - `apps/api/src/middleware/auth.ts`
     - `apps/api/src/users/user.repo.ts`
     - `apps/api/src/access-requests/access-request.routes.ts`
     - `apps/api/src/admissions/admission.schemas.ts`
     - `apps/api/src/courses/courses.schemas.ts`
     - `apps/api/src/leads/lead.schemas.ts`
     - `apps/api/src/classroom/classroom.schemas.ts`
     - `apps/api/src/users/users-management.schemas.ts`
     - `apps/web/src/lib/users-rbac.ts`
     - `apps/web/src/pages/admissions/types.ts`
     - `apps/web/src/pages/courses/types.ts`
     - `apps/web/src/pages/leads/types.ts`

## P2

9. **Fix unstable list key usage**
   - **Why:** `Math.random()` keys cause remounts and state loss every render.
   - **Change:** Use deterministic key from domain id (or fallback composite key).
   - **Files:**
     - `apps/web/src/pages/classroom-page.tsx`

10. **Add resilient non-blocking error UI and retry actions**
   - **Why:** Current UX relies mainly on toasts. Inline recoverable fallbacks with retry actions improve reliability and perceived stability.
   - **Change:** Add per-section error states (`Alert`/fallback panels) and retry buttons via Query `refetch`; preserve stale data where possible.
   - **Files:**
     - `apps/web/src/pages/leads-page.tsx`
     - `apps/web/src/pages/courses-page.tsx`
     - `apps/web/src/pages/instruments-page.tsx`
     - `apps/web/src/pages/admissions-page.tsx`
     - `apps/web/src/pages/classroom-page.tsx`
     - `apps/web/src/pages/users/users-list-page.tsx`
     - `apps/web/src/pages/users/user-detail-page.tsx`

11. **Add route/app-level error boundaries**
   - **Why:** Render failures currently have no consistent fallback boundary.
   - **Change:** Add router-level error components and top-level React error boundary with safe fallback UI.
   - **Files:**
     - `apps/web/src/router.tsx`
     - `apps/web/src/main.tsx`

12. **Eliminate unsafe casts and `any` usage in critical paths**
   - **Why:** Unsafe casts hide type bugs and reduce confidence in refactors.
   - **Change:** Replace `Array<any>` and role casts with typed helpers/guards.
   - **Files:**
     - `apps/api/src/classroom/classroom.service.ts`
     - `apps/web/src/components/layout/app-shell.tsx`
     - `apps/web/src/components/navigation/app-sidebar.tsx`
     - `apps/web/src/pages/users-pages.tsx`

13. **Standardize backend error response contract across modules**
   - **Why:** API currently returns mixed error shapes (`string`, `flatten`, nested objects), forcing inconsistent frontend parsing.
   - **Change:** Introduce one error envelope format and use it in all controllers/routes.
   - **Files:**
     - `apps/api/src/leads/lead.controller.ts`
     - `apps/api/src/leads/lead-stage.controller.ts`
     - `apps/api/src/courses/courses.controller.ts`
     - `apps/api/src/courses/instruments.controller.ts`
     - `apps/api/src/admissions/admission.controller.ts`
     - `apps/api/src/admissions/course-plan.controller.ts`
     - `apps/api/src/classroom/classroom.controller.ts`
     - `apps/api/src/users/users-management.controller.ts`
     - `apps/api/src/access-requests/access-request.routes.ts`
     - `apps/api/src/routes/users.ts`

14. **Refactor access-request router into controller/service/repo layers**
   - **Why:** Current file mixes validation, persistence, auth orchestration, and response formatting in one place.
   - **Change:** Align with domain module pattern used elsewhere for easier testing and separation of concerns.
   - **Files:**
     - `apps/api/src/access-requests/access-request.routes.ts`

15. **Consolidate duplicated frontend utility logic**
   - **Why:** `getErrorMessage`, API base URL derivation, and role-based route mapping are repeated.
   - **Change:** Extract reusable helpers (`api.ts`, `errors.ts`, `route-maps.ts`) and import everywhere.
   - **Files:**
     - `apps/web/src/pages/classroom-page.tsx`
     - `apps/web/src/pages/courses-page.tsx`
     - `apps/web/src/pages/instruments-page.tsx`
     - `apps/web/src/pages/admissions-page.tsx`
     - `apps/web/src/pages/leads-page.tsx`
     - `apps/web/src/pages/users/users-list-page.tsx`
     - `apps/web/src/pages/users/user-detail-page.tsx`
     - `apps/web/src/pages/courses/course-plans-tab.tsx`
     - `apps/web/src/pages/auth/request-access-page.tsx`

## P3

16. **Add linting + architectural guardrails for consistency**
   - **Why:** Both apps currently report `No lint configured`, allowing hook violations, unsafe casts, and code duplication to slip in.
   - **Change:** Add ESLint config (React Hooks, TS safety, import boundaries, no duplicate helpers), and enforce in CI.
   - **Files:**
     - `apps/web/package.json`
     - `apps/api/package.json`
     - `package.json`
