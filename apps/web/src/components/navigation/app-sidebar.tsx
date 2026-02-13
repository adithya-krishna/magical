import { Link, useLocation } from "@tanstack/react-router"
import { BookOpen, Guitar, LayoutDashboard, Settings2, Users } from "lucide-react"
import { NavMain } from "@/components/navigation/nav-main"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type SidebarUser = {
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
        <NavMain items={[...navItems]} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={pathname.startsWith("/settings")}
            >
              <Link to="/settings">
                <Settings2 />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
