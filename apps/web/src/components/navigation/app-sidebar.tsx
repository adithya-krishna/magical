import { Link, useLocation } from "@tanstack/react-router"
import { BookOpen, CircleCheckBig, Guitar, LayoutDashboard, Presentation, Settings2, SlidersHorizontal, Users } from "lucide-react"
import { NavMain } from "@/components/navigation/nav-main"
import { NavUser } from "@/components/navigation/nav-user"
import { canViewUserList, type AppRole } from "@/lib/users-rbac"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarUser = {
  id: string
  role?: string | null
  email: string
  name?: string | null
  image?: string | null
}

const navItems = [
  {
    title: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    to: "/leads",
    icon: Users,
  },
  {
    title: "Admissions",
    to: "/admissions",
    icon: CircleCheckBig,
  },
  {
    title: "Classroom",
    to: "/classroom",
    icon: Presentation,
  },
  {
    title: "Courses",
    to: "/courses",
    icon: BookOpen,
  },
  {
    title: "Instruments",
    to: "/instruments",
    icon: Guitar,
  },
] as const

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const appRole = (user.role ?? "student") as AppRole
  const showStudentsList = canViewUserList(appRole, "student")
  const showTeachersList = canViewUserList(appRole, "teacher")
  const showStaffList = canViewUserList(appRole, "staff")
  const showAdminsList = canViewUserList(appRole, "admin")
  const canViewAdmissions = appRole === "super_admin" || appRole === "admin" || appRole === "staff"
  const canViewClassroom = appRole === "super_admin" || appRole === "admin" || appRole === "staff"

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="muzigal">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  M
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">muzigal</span>
                  <span className="truncate text-xs">dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={navItems.filter((item) => {
            if (item.to === "/admissions") {
              return canViewAdmissions
            }
            if (item.to === "/classroom") {
              return canViewClassroom
            }
            return true
          })}
        />

        <SidebarGroup>
          <SidebarGroupLabel>Users</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {canViewUserList(appRole, "student") ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/users/students")}>
                    <Link to="/users/students">
                      <Users />
                      <span>Students</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {!showStudentsList && appRole === "student" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/users/students/${user.id}`)}
                  >
                    <Link
                      to="/users/students/$id/$tab"
                      params={{ id: user.id, tab: "profile" }}
                    >
                      <Users />
                      <span>My Student Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {canViewUserList(appRole, "teacher") ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/users/teachers")}>
                    <Link to="/users/teachers">
                      <Users />
                      <span>Teachers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {!showTeachersList && appRole === "teacher" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/users/teachers/${user.id}`)}
                  >
                    <Link
                      to="/users/teachers/$id/$tab"
                      params={{ id: user.id, tab: "profile" }}
                    >
                      <Users />
                      <span>My Teacher Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {canViewUserList(appRole, "staff") ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/users/staff")}>
                    <Link to="/users/staff">
                      <Users />
                      <span>Staff</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {!showStaffList && appRole === "staff" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/users/staff/${user.id}`)}
                  >
                    <Link to="/users/staff/$id/$tab" params={{ id: user.id, tab: "profile" }}>
                      <Users />
                      <span>My Staff Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {canViewUserList(appRole, "admin") ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/users/admins")}>
                    <Link to="/users/admins">
                      <Users />
                      <span>Admins</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {!showAdminsList && appRole === "admin" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(`/users/admins/${user.id}`)}
                  >
                    <Link to="/users/admins/$id/$tab" params={{ id: user.id, tab: "profile" }}>
                      <Users />
                      <span>My Admin Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={pathname === "/settings"}
            >
              <Link to="/settings">
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Config"
              isActive={pathname.startsWith("/settings/config")}
            >
              <Link to="/settings/config">
                <SlidersHorizontal />
                <span>Config</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
