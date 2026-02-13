import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"
import { canManageUsers, canViewOwnProfile, canViewUserList, type AppRole, type ManagedUserRole } from "@/lib/users-rbac"
import type {
  StudentProgressResponse,
  StudentRescheduleResponse,
  UserAttendanceResponse,
  UserDetailResponse,
} from "@/pages/users/types"

const endpointMap: Record<ManagedUserRole, string> = {
  student: "users/students",
  teacher: "users/teachers",
  staff: "users/staff",
  admin: "users/admins",
}

const tabsByRole: Record<ManagedUserRole, string[]> = {
  student: ["profile", "attendance", "progress", "reschedule-requests"],
  teacher: ["profile", "attendance"],
  staff: ["profile", "attendance"],
  admin: ["profile", "attendance"],
}

type UserDetailPageProps = {
  role: ManagedUserRole
  id: string
  tab: string
}

function UserTabLink({
  role,
  id,
  tab,
  label,
}: {
  role: ManagedUserRole
  id: string
  tab: string
  label: string
}) {
  if (role === "student") {
    return (
      <Link to="/users/students/$id/$tab" params={{ id, tab }}>
        {label}
      </Link>
    )
  }

  if (role === "teacher") {
    return (
      <Link to="/users/teachers/$id/$tab" params={{ id, tab }}>
        {label}
      </Link>
    )
  }

  if (role === "staff") {
    return (
      <Link to="/users/staff/$id/$tab" params={{ id, tab }}>
        {label}
      </Link>
    )
  }

  return (
    <Link to="/users/admins/$id/$tab" params={{ id, tab }}>
      {label}
    </Link>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return fallback
}

export function UserDetailPage({ role, id, tab }: UserDetailPageProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const viewer = session.data?.user as { id: string; role?: AppRole } | undefined
  const viewerRole = viewer?.role ?? "student"

  const canView = canViewUserList(viewerRole, role) || (viewer ? canViewOwnProfile(viewerRole, role) && viewer.id === id : false)
  const canManage = viewer ? canManageUsers(viewerRole, role) : false
  const allowedTabs = tabsByRole[role]
  const activeTab = allowedTabs.includes(tab) ? tab : "profile"

  const detailQuery = useQuery({
    queryKey: ["user-detail", role, id],
    enabled: canView,
    queryFn: async (): Promise<UserDetailResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}/${id}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load user details")
      }
      return response.json()
    },
  })

  const attendanceQuery = useQuery({
    queryKey: ["user-attendance", role, id],
    enabled: canView && activeTab === "attendance",
    queryFn: async (): Promise<UserAttendanceResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}/${id}/attendance`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load attendance")
      return response.json()
    },
  })

  const progressQuery = useQuery({
    queryKey: ["student-progress", id],
    enabled: canView && role === "student" && activeTab === "progress",
    queryFn: async (): Promise<StudentProgressResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/users/students/${id}/progress`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load progress")
      return response.json()
    },
  })

  const rescheduleQuery = useQuery({
    queryKey: ["student-reschedule", id],
    enabled: canView && role === "student" && activeTab === "reschedule-requests",
    queryFn: async (): Promise<StudentRescheduleResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/users/students/${id}/reschedule-requests`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load reschedule requests")
      return response.json()
    },
  })

  const [attendanceDate, setAttendanceDate] = useState("")
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "late" | "excused">("present")
  const [attendanceNotes, setAttendanceNotes] = useState("")
  const [profileNotes, setProfileNotes] = useState("")
  const [tempPassword, setTempPassword] = useState("")

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes: profileNotes || null }),
      })
      if (!response.ok) throw new Error("Failed to update profile")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-detail", role, id] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update profile.")),
  })

  const createAttendanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workDate: attendanceDate,
          status: attendanceStatus,
          notes: attendanceNotes || undefined,
        }),
      })
      if (!response.ok) throw new Error("Failed to add attendance")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-attendance", role, id] })
      setAttendanceDate("")
      setAttendanceNotes("")
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to add attendance.")),
  })

  const setPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/users/students/${id}/set-temporary-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: tempPassword }),
      })
      if (!response.ok) throw new Error("Failed to set temporary password")
    },
    onSuccess: () => {
      toast.success("Temporary password set")
      setTempPassword("")
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to set temporary password.")),
  })

  const tabLinks = useMemo(
    () =>
      allowedTabs.map((tabKey) => {
        const label = tabKey.replace(/-/g, " ")
        return { key: tabKey, label: label.charAt(0).toUpperCase() + label.slice(1) }
      }),
    [allowedTabs]
  )

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access restricted</CardTitle>
          <CardDescription>You do not have access to this user page.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  useEffect(() => {
    if (detailQuery.isError) {
      toast.error(getErrorMessage(detailQuery.error, "Unable to load user details."))
    }
  }, [detailQuery.isError, detailQuery.error])

  const detail = detailQuery.data?.data

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {detail ? `${detail.firstName} ${detail.lastName}` : "User"}
        </h1>
        <p className="text-sm text-muted-foreground">Role: {role}</p>
      </div>

      <Tabs value={activeTab}>
        <TabsList>
          {tabLinks.map((item) => (
            <TabsTrigger key={item.key} value={item.key} asChild>
              <UserTabLink role={role} id={id} tab={item.key} label={item.label} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "profile" ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Contact details and profile metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <span className="font-medium">Email:</span> {detail?.email ?? "-"}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {detail?.phone ?? "-"}
            </p>
            <div className="space-y-2">
              <Label htmlFor="user-notes">Notes</Label>
              <Textarea
                id="user-notes"
                defaultValue={detail?.profile?.notes ?? ""}
                onChange={(event) => setProfileNotes(event.target.value)}
                disabled={!canManage}
              />
            </div>
            {canManage ? (
              <Button onClick={() => updateProfileMutation.mutate()}>Save profile</Button>
            ) : null}

            {role === "student" && canManage ? (
              <div className="rounded-md border p-4">
                <p className="font-medium">Set temporary password</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Students do not use access requests. Set a temporary password after admission.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="password"
                    value={tempPassword}
                    onChange={(event) => setTempPassword(event.target.value)}
                    placeholder="Temporary password"
                  />
                  <Button
                    onClick={() => setPasswordMutation.mutate()}
                    disabled={tempPassword.length < 8}
                  >
                    Set
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "attendance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Track attendance events for this user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canManage ? (
              <div className="grid gap-3 md:grid-cols-4">
                <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                <Select value={attendanceStatus} onValueChange={(value) => setAttendanceStatus(value as typeof attendanceStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  placeholder="Notes"
                />
                <Button onClick={() => createAttendanceMutation.mutate()} disabled={!attendanceDate}>
                  Add
                </Button>
              </div>
            ) : null}

            <div className="space-y-2 text-sm">
              {(attendanceQuery.data?.data ?? []).map((record) => (
                <div key={record.id} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{record.workDate}</span>
                    <span className="capitalize text-muted-foreground">{record.status}</span>
                  </div>
                  {record.notes ? <p className="mt-1 text-muted-foreground">{record.notes}</p> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {role === "student" && activeTab === "progress" ? (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Skill updates and level progression entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(progressQuery.data?.data ?? []).map((item) => (
              <div key={item.id} className="rounded-md border px-3 py-2">
                <p className="font-medium">{item.skillArea}</p>
                <p className="text-muted-foreground">Level: {item.level}</p>
                {item.notes ? <p className="mt-1">{item.notes}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {role === "student" && activeTab === "reschedule-requests" ? (
        <Card>
          <CardHeader>
            <CardTitle>Reschedule requests</CardTitle>
            <CardDescription>Read-only timeline of reschedule requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(rescheduleQuery.data?.data ?? []).map((item) => (
              <div key={item.id} className="rounded-md border px-3 py-2">
                <p>
                  Requested: {item.requestedDate} • <span className="capitalize">{item.status}</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
