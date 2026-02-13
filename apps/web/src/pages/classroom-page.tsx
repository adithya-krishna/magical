import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"

type AppRole = "super_admin" | "admin" | "staff" | "teacher" | "student"

type DashboardSlot = {
  id: string
  courseId: string
  teacherId: string
  capacity: number
  occupancy: number
  timeSlot?: { id: string; dayOfWeek: number; startTime: string; endTime: string } | null
  course?: { id: string; name?: string | null } | null
  teacher?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

type DashboardGroup = {
  timeSlot?: { id: string; dayOfWeek: number; startTime: string; endTime: string } | null
  slots: DashboardSlot[]
}

type AttendanceRow = {
  attendance: {
    id: string
    studentId: string
    classroomSlotId: string
    classDate: string
    status: "scheduled" | "present" | "absent" | "late" | "excused"
  }
  student?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

type StudentOption = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type TimeSlot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  durationMinutes: number
  isActive: boolean
}

type ClassroomSlot = {
  id: string
  courseId: string
  teacherId: string
  capacity: number
  occupancy: number
  isActive: boolean
  timeSlot?: { dayOfWeek?: number; startTime?: string; endTime?: string } | null
  course?: { name?: string | null } | null
  teacher?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

type RescheduleRow = {
  id: string
  studentId: string
  originalAttendanceId: string
  requestedDate: string
  requestedSlotId?: string | null
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function isClassroomAllowed(role: AppRole) {
  return role === "super_admin" || role === "admin" || role === "staff"
}

function canManageClassroom(role: AppRole) {
  return role === "super_admin" || role === "admin"
}

function formatPersonName(person?: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}) {
  const fullName = `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim()
  return fullName || person?.email || "-"
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return fallback
}

export function ClassroomPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const role = ((session.data?.user as { role?: AppRole } | undefined)?.role ?? "student") as AppRole
  const canView = isClassroomAllowed(role)
  const canManage = canManageClassroom(role)

  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedDay, setSelectedDay] = useState("2")
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedSlot, setSelectedSlot] = useState<DashboardSlot | null>(null)
  const [slotSheetOpen, setSlotSheetOpen] = useState(false)
  const [studentToAssign, setStudentToAssign] = useState("")

  const [draftDays, setDraftDays] = useState<Array<{ dayOfWeek: number; isOpen: boolean }>>([])
  const [slotDayOfWeek, setSlotDayOfWeek] = useState("2")
  const [slotStartTime, setSlotStartTime] = useState("15:00")
  const [slotEndTime, setSlotEndTime] = useState("16:00")
  const [slotDuration, setSlotDuration] = useState("60")
  const [courseId, setCourseId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [timeSlotId, setTimeSlotId] = useState("")
  const [capacity, setCapacity] = useState("10")

  const operatingDaysQuery = useQuery({
    queryKey: ["operating-days", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/operating-days`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load operating days")
      }
      return response.json() as Promise<{ data: Array<{ dayOfWeek: number; isOpen: boolean }> }>
    },
  })

  useEffect(() => {
    const items = operatingDaysQuery.data?.data
    if (!items) {
      return
    }
    setDraftDays(items.map((item) => ({ dayOfWeek: item.dayOfWeek, isOpen: item.isOpen })))
  }, [operatingDaysQuery.data?.data])

  const dashboardQuery = useQuery({
    queryKey: ["classroom-dashboard", selectedDay],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-dashboard?day=${selectedDay}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load classroom dashboard")
      }
      return response.json() as Promise<{ data: DashboardGroup[] }>
    },
  })

  const attendanceQuery = useQuery({
    queryKey: ["classroom-attendance", selectedSlot?.id, selectedDate],
    enabled: canView && slotSheetOpen && Boolean(selectedSlot?.id),
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/api/v1/classrooms/${selectedSlot?.id}/attendance?date=${selectedDate}`,
        { credentials: "include" }
      )
      if (!response.ok) {
        throw new Error("Failed to load attendance")
      }
      return response.json() as Promise<{ data: AttendanceRow[] }>
    },
  })

  const studentsQuery = useQuery({
    queryKey: ["classroom-students", selectedSlot?.courseId, selectedSlot?.teacherId],
    enabled: canManage && slotSheetOpen && Boolean(selectedSlot?.courseId) && Boolean(selectedSlot?.teacherId),
    queryFn: async () => {
      const params = new URLSearchParams({
        courseId: selectedSlot!.courseId,
        teacherId: selectedSlot!.teacherId,
      })
      const response = await fetch(`${apiUrl}/api/v1/students?${params}`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load students")
      }
      return response.json() as Promise<{ data: StudentOption[] }>
    },
  })

  const rescheduleQuery = useQuery({
    queryKey: ["reschedule-requests", "pending", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/reschedule-requests?status=pending`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load reschedule requests")
      }
      return response.json() as Promise<{ data: RescheduleRow[] }>
    },
  })

  const timeSlotsQuery = useQuery({
    queryKey: ["time-slots", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/time-slots`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load time slots")
      }
      return response.json() as Promise<{ data: TimeSlot[] }>
    },
  })

  const classroomSlotsQuery = useQuery({
    queryKey: ["classroom-slots", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load classroom slots")
      }
      return response.json() as Promise<{ data: ClassroomSlot[] }>
    },
  })

  const coursesQuery = useQuery({
    queryKey: ["courses", "active", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/courses?page=1&pageSize=100&isActive=true`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load courses")
      }
      return response.json() as Promise<{ data: Array<{ id: string; name: string }> }>
    },
  })

  const teachersQuery = useQuery({
    queryKey: ["teachers", "classroom"],
    enabled: canView,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/users?roles=teacher`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load teachers")
      }
      return response.json() as Promise<{
        data: Array<{ id: string; firstName?: string | null; lastName?: string | null; email: string }>
      }>
    },
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, status }: { attendanceId: string; status: AttendanceRow["attendance"]["status"] }) => {
      const response = await fetch(
        `${apiUrl}/api/v1/classrooms/${selectedSlot?.id}/attendance/${attendanceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      )
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to update attendance")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-attendance"] })
      toast.success("Attendance updated")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update attendance."))
    },
  })

  const assignStudentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !studentToAssign) {
        return
      }
      const response = await fetch(`${apiUrl}/api/v1/classroom-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: studentToAssign,
          classroomSlotId: selectedSlot.id,
          startDate: selectedDate,
          status: "active",
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to assign student")
      }
    },
    onSuccess: async () => {
      setStudentToAssign("")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-attendance"] }),
      ])
      toast.success("Student assigned to classroom slot")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to assign student."))
    },
  })

  const updateRescheduleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const response = await fetch(`${apiUrl}/api/v1/reschedule-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to update reschedule request")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reschedule-requests"] })
      toast.success("Reschedule request updated")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update request."))
    },
  })

  const saveOperatingDaysMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/operating-days`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draftDays),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to save operating days")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operating-days"] })
      toast.success("Operating days updated")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to save operating days."))
    },
  })

  const createTimeSlotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/time-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dayOfWeek: Number(slotDayOfWeek),
          startTime: slotStartTime,
          endTime: slotEndTime,
          durationMinutes: Number(slotDuration),
          isActive: true,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to create time slot")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["time-slots"] })
      toast.success("Time slot created")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create time slot."))
    },
  })

  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/time-slots/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to delete time slot")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["time-slots"] })
      toast.success("Time slot archived")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to archive time slot."))
    },
  })

  const createClassroomSlotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          teacherId,
          timeSlotId,
          capacity: Number(capacity),
          isActive: true,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to create classroom slot")
      }
    },
    onSuccess: async () => {
      setCourseId("")
      setTeacherId("")
      setTimeSlotId("")
      setCapacity("10")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-slots"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success("Classroom allocation created")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create classroom allocation."))
    },
  })

  const deleteClassroomSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to delete classroom slot")
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-slots"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success("Classroom allocation archived")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to archive classroom allocation."))
    },
  })

  useEffect(() => {
    if (dashboardQuery.isError) {
      toast.error(getErrorMessage(dashboardQuery.error, "Unable to load classroom dashboard."))
    }
  }, [dashboardQuery.isError, dashboardQuery.error])

  const tabs = useMemo(() => {
    return [
      { value: "dashboard", label: "Dashboard", visible: canView },
      { value: "attendance", label: "Attendance", visible: canView },
      { value: "enrollments", label: "Enrollments", visible: canView },
      { value: "config", label: "Config", visible: canManage },
    ].filter((tab) => tab.visible)
  }, [canManage, canView])

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classroom</CardTitle>
          <CardDescription>
            You do not have access to classroom workflows. This page is available to super admins, admins, and staff.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classroom</h1>
        <p className="text-sm text-muted-foreground">
          Manage classroom slots, attendance, enrollments, and operating configuration.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classroom dashboard</CardTitle>
              <CardDescription>Cards are grouped by time slot. Click a card for attendance and enrollment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="classroom-day">Day</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger id="classroom-day" className="w-[220px]">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayLabels.map((label, index) => (
                      <SelectItem key={label} value={String(index)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dashboardQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading classroom dashboard...</p>
              ) : null}

              <div className="space-y-5">
                {(dashboardQuery.data?.data ?? []).map((group) => (
                  <div key={group.timeSlot?.id ?? Math.random().toString()} className="space-y-3">
                    <div className="text-sm font-medium">
                      {group.timeSlot ? `${dayLabels[group.timeSlot.dayOfWeek]} ${group.timeSlot.startTime.slice(0, 5)} - ${group.timeSlot.endTime.slice(0, 5)}` : "Unknown time slot"}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {group.slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          className="rounded-lg border p-4 text-left transition hover:bg-muted/40"
                          onClick={() => {
                            setSelectedSlot(slot)
                            setSlotSheetOpen(true)
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{slot.course?.name ?? "Unassigned course"}</p>
                            <Badge variant={slot.occupancy >= slot.capacity ? "destructive" : "secondary"}>
                              {slot.occupancy}/{slot.capacity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">Teacher: {formatPersonName(slot.teacher ?? undefined)}</p>
                          <p className="mt-2 text-xs text-muted-foreground">Click to manage attendance and enrollments</p>
                        </button>
                      ))}
                      {group.slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No classroom slots for this time.</p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!dashboardQuery.isLoading && !(dashboardQuery.data?.data ?? []).length ? (
                  <p className="text-sm text-muted-foreground">No classroom slots found for this day.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reschedule queue</CardTitle>
              <CardDescription>Pending student requests. Staff can view; admins can approve/reject.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(rescheduleQuery.data?.data ?? []).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.requestedDate}</TableCell>
                        <TableCell className="font-mono text-xs">{request.studentId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {canManage ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRescheduleMutation.mutate({ id: request.id, status: "rejected" })}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateRescheduleMutation.mutate({ id: request.id, status: "approved" })}
                              >
                                Approve
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">View only</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rescheduleQuery.isLoading && !(rescheduleQuery.data?.data ?? []).length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                          No pending requests.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment actions</CardTitle>
              <CardDescription>
                Use the Dashboard tab and click a classroom card to add students to that slot.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operating days</CardTitle>
              <CardDescription>Set which weekdays are open for classroom assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {draftDays.map((day, index) => (
                <div key={day.dayOfWeek} className="flex items-center justify-between rounded border px-3 py-2">
                  <span className="text-sm font-medium">{dayLabels[day.dayOfWeek]}</span>
                  <Switch
                    checked={day.isOpen}
                    onCheckedChange={(checked) =>
                      setDraftDays((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, isOpen: checked } : item
                        )
                      )
                    }
                  />
                </div>
              ))}
              <Button onClick={() => saveOperatingDaysMutation.mutate()} disabled={saveOperatingDaysMutation.isPending}>
                {saveOperatingDaysMutation.isPending ? "Saving..." : "Save operating days"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time slots</CardTitle>
              <CardDescription>Create and archive slot templates by day and time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Select value={slotDayOfWeek} onValueChange={setSlotDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayLabels.map((label, index) => (
                      <SelectItem key={label} value={String(index)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="time" value={slotStartTime} onChange={(event) => setSlotStartTime(event.target.value)} />
                <Input type="time" value={slotEndTime} onChange={(event) => setSlotEndTime(event.target.value)} />
                <Input
                  type="number"
                  min={30}
                  value={slotDuration}
                  onChange={(event) => setSlotDuration(event.target.value)}
                />
                <Button onClick={() => createTimeSlotMutation.mutate()} disabled={createTimeSlotMutation.isPending}>
                  {createTimeSlotMutation.isPending ? "Saving..." : "Add time slot"}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(timeSlotsQuery.data?.data ?? []).map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>{dayLabels[slot.dayOfWeek]}</TableCell>
                        <TableCell>{slot.startTime.slice(0, 5)}</TableCell>
                        <TableCell>{slot.endTime.slice(0, 5)}</TableCell>
                        <TableCell>{slot.durationMinutes}m</TableCell>
                        <TableCell>{slot.isActive ? "Active" : "Archived"}</TableCell>
                        <TableCell className="text-right">
                          {slot.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTimeSlotMutation.mutate(slot.id)}
                            >
                              Archive
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classroom allocations</CardTitle>
              <CardDescription>Map course + teacher + time slot with capacity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(coursesQuery.data?.data ?? []).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teachersQuery.data?.data ?? []).map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {formatPersonName(teacher)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={timeSlotId} onValueChange={setTimeSlotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {(timeSlotsQuery.data?.data ?? [])
                      .filter((slot) => slot.isActive)
                      .map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {dayLabels[slot.dayOfWeek]} {slot.startTime.slice(0, 5)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  placeholder="Capacity"
                />

                <Button
                  onClick={() => createClassroomSlotMutation.mutate()}
                  disabled={!courseId || !teacherId || !timeSlotId || Number(capacity) < 1}
                >
                  Add allocation
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(classroomSlotsQuery.data?.data ?? []).map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>{dayLabels[slot.timeSlot?.dayOfWeek ?? 0]}</TableCell>
                        <TableCell>{slot.timeSlot?.startTime?.slice(0, 5) ?? "-"}</TableCell>
                        <TableCell>{slot.course?.name ?? "-"}</TableCell>
                        <TableCell>{formatPersonName(slot.teacher ?? undefined)}</TableCell>
                        <TableCell>{slot.capacity}</TableCell>
                        <TableCell>{slot.occupancy}</TableCell>
                        <TableCell className="text-right">
                          {slot.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteClassroomSlotMutation.mutate(slot.id)}
                            >
                              Archive
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={slotSheetOpen} onOpenChange={setSlotSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selectedSlot?.course?.name ?? "Classroom slot"}</SheetTitle>
            <SheetDescription>
              {selectedSlot?.timeSlot
                ? `${dayLabels[selectedSlot.timeSlot.dayOfWeek]} ${selectedSlot.timeSlot.startTime.slice(0, 5)} - ${selectedSlot.timeSlot.endTime.slice(0, 5)}`
                : "Manage attendance and enrollments"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="rounded-md border p-4 text-sm">
              <p>
                <span className="font-medium">Teacher:</span> {formatPersonName(selectedSlot?.teacher ?? undefined)}
              </p>
              <p className="mt-1">
                <span className="font-medium">Occupancy:</span> {selectedSlot?.occupancy ?? 0}/{selectedSlot?.capacity ?? 0}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendance-date">Attendance date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {canManage ? (
              <div className="space-y-2 rounded-md border p-3">
                <Label>Add student to slot</Label>
                <div className="flex items-center gap-2">
                  <Select value={studentToAssign} onValueChange={setStudentToAssign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {(studentsQuery.data?.data ?? []).map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => assignStudentMutation.mutate()}
                    disabled={!studentToAssign || assignStudentMutation.isPending}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Attendance list</Label>
                <Badge variant="outline">{attendanceQuery.data?.data?.length ?? 0}</Badge>
              </div>

              {attendanceQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading attendance...</p>
              ) : null}

              <div className="space-y-2">
                {(attendanceQuery.data?.data ?? []).map((row) => (
                  <div key={row.attendance.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{formatPersonName(row.student ?? undefined)}</p>
                        <p className="text-xs text-muted-foreground">{row.student?.email || row.attendance.studentId}</p>
                      </div>
                      {canManage ? (
                        <Select
                          value={row.attendance.status}
                          onValueChange={(value) =>
                            updateAttendanceMutation.mutate({
                              attendanceId: row.attendance.id,
                              status: value as AttendanceRow["attendance"]["status"],
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{row.attendance.status}</Badge>
                      )}
                    </div>
                  </div>
                ))}

                {!attendanceQuery.isLoading && !(attendanceQuery.data?.data ?? []).length ? (
                  <p className="text-sm text-muted-foreground">No attendance rows found for this date.</p>
                ) : null}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
