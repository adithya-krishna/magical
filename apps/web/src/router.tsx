import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router"
import { AppShell } from "@/components/layout/app-shell"
import { redirectIfAuthenticated, requireAuthSession } from "@/lib/auth-guards"
import { LoginPage } from "@/pages/auth/login-page"
import { RequestAccessPage } from "@/pages/auth/request-access-page"
import { HomePage } from "@/pages/home-page"
import { CoursesPage } from "@/pages/courses-page"
import { InstrumentsPage } from "@/pages/instruments-page"
import { LeadsPage } from "@/pages/leads-page"
import { ProfilePage } from "@/pages/profile/profile-page"
import { SettingsPage } from "@/pages/settings/settings-page"

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

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: ProfilePage,
})

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([loginRoute, requestAccessRoute]),
  appRoute.addChildren([
    indexRoute,
    leadsRoute,
    coursesRoute,
    instrumentsRoute,
    settingsRoute,
    profileRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
