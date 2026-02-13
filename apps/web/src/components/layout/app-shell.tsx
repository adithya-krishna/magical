import { useEffect } from "react"
import { Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/navigation/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import {
  applyTheme,
  getThemePreference,
  watchSystemThemeChange,
} from "@/lib/theme"

export function AppShell() {
  const session = authClient.useSession()
  const user = session.data?.user

  useEffect(() => {
    let removeSystemListener: (() => void) | undefined

    const syncTheme = () => {
      if (removeSystemListener) {
        removeSystemListener()
        removeSystemListener = undefined
      }

      const preference = getThemePreference()
      applyTheme(preference)

      if (preference === "system") {
        removeSystemListener = watchSystemThemeChange(() => {
          if (getThemePreference() === "system") {
            applyTheme("system")
          }
        })
      }
    }

    syncTheme()

    const handlePreferenceChange = () => syncTheme()
    window.addEventListener("theme-preference-change", handlePreferenceChange)
    window.addEventListener("storage", handlePreferenceChange)

    return () => {
      if (removeSystemListener) {
        removeSystemListener()
      }

      window.removeEventListener("theme-preference-change", handlePreferenceChange)
      window.removeEventListener("storage", handlePreferenceChange)
    }
  }, [])

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          id: user.id,
          role: (user as { role?: string }).role,
          email: user.email,
          name: user.name,
          image: user.image,
        }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">Muzigal</span>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
