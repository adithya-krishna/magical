import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"
import { AppShell } from "@/components/layout/app-shell"
import { redirectIfAuthenticated, requireAuthSession } from "@/lib/auth-guards"
import { LoginPage } from "@/pages/auth/login-page"
import { RequestAccessPage } from "@/pages/auth/request-access-page"
import { HomePage } from "@/pages/home-page"
import { CoursesPage } from "@/pages/courses-page"
import { InstrumentsPage } from "@/pages/instruments-page"
import { LeadsPage } from "@/pages/leads-page"
import { LeadsDetailPage } from "@/pages/leads-detail-page"
import { AdmissionsPage } from "@/pages/admissions-page"
import { ClassroomPage } from "@/pages/classroom-page"
import { ProfilePage } from "@/pages/profile/profile-page"
import { SettingsPage } from "@/pages/settings/settings-page"
import { ConfigPage } from "@/pages/settings/config-page"
import {
  AdminDetailPage,
  AdminsPage,
  StaffDetailPage,
  StaffPage,
  StudentDetailPage,
  StudentsPage,
  TeacherDetailPage,
  TeachersPage,
} from "@/pages/users-pages"

const rootRoute = createRootRoute({
  component: Outlet,
})

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: Outlet,
})

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/login",
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
})

const requestAccessRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/request-access",
  component: RequestAccessPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: requireAuthSession,
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: HomePage,
})

const leadsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/leads",
  component: LeadsPage,
})

const leadDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/leads/$id/$tab",
  component: LeadsDetailPage,
})

const admissionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admissions",
  component: AdmissionsPage,
})

const classroomRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/classroom",
  component: ClassroomPage,
})

const coursesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/courses",
  component: CoursesPage,
})

const instrumentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/instruments",
  component: InstrumentsPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
})

const configRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings/config",
  component: ConfigPage,
})

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: ProfilePage,
})

const studentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/students",
  component: StudentsPage,
})

const studentDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/students/$id/$tab",
  component: StudentDetailPage,
})

const teachersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/teachers",
  component: TeachersPage,
})

const teacherDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/teachers/$id/$tab",
  component: TeacherDetailPage,
})

const staffRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/staff",
  component: StaffPage,
})

const staffDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/staff/$id/$tab",
  component: StaffDetailPage,
})

const adminsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/admins",
  component: AdminsPage,
})

const adminDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users/admins/$id/$tab",
  component: AdminDetailPage,
})

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([loginRoute, requestAccessRoute]),
  appRoute.addChildren([
    indexRoute,
    leadsRoute,
    leadDetailRoute,
    admissionsRoute,
    classroomRoute,
    coursesRoute,
    instrumentsRoute,
    studentsRoute,
    studentDetailRoute,
    teachersRoute,
    teacherDetailRoute,
    staffRoute,
    staffDetailRoute,
    adminsRoute,
    adminDetailRoute,
    settingsRoute,
    configRoute,
    profileRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
