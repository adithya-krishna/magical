import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { format, parse } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-tables/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClassroomSlotColumns, createRescheduleColumns } from "@/pages/classroom/columns"
import { ClassroomBulkAllocationSheet } from "@/pages/classroom/components/classroom-bulk-allocation-sheet"
import { ClassCard } from "@/pages/classroom/components/class-card"
import { DashboardFilters } from "@/pages/classroom/components/dashboard-filters"
import { ClassroomSingleAllocationSheet } from "@/pages/classroom/components/classroom-single-allocation-sheet"
import { WeekPicker } from "@/pages/classroom/components/week-picker"
import type {
  AppRole,
  ClassroomSlot,
  CourseOption,
  DashboardGroup,
  DashboardSlot,
  RescheduleRow,
  SettingsConfigResponse,
  TeacherOption,
  TimeSlot,
} from "@/pages/classroom/types"
import {
  canManageClassroom,
  dayLabels,
  formatPersonName,
  formatTimeLabel,
  getErrorMessage,
  isClassroomAllowed,
} from "@/pages/classroom/utils"
import { authClient } from "@/lib/auth-client"
import type { PreferredSlotSelection } from "@/components/preferred-slots-selection"

function readDate(raw?: unknown) {
  const today = format(new Date(), "yyyy-MM-dd")
  if (typeof raw !== "string" || !raw) {
    return today
  }

  const parsed = parse(raw, "yyyy-MM-dd", new Date())
  if (Number.isNaN(parsed.getTime())) {
    return today
  }

  return format(parsed, "yyyy-MM-dd")
}

export function ClassroomPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, unknown>

  const session = authClient.useSession()
  const role = ((session.data?.user as { role?: AppRole } | undefined)?.role ?? "student") as AppRole
  const canView = isClassroomAllowed(role)
  const canManage = canManageClassroom(role)

  const activeTab = typeof search.tab === "string" ? search.tab : "dashboard"
  const selectedDateText = readDate(search.date)
  const selectedDate = parse(selectedDateText, "yyyy-MM-dd", new Date())
  const selectedDay = selectedDate.getDay()
  const selectedCourseId = typeof search.courseId === "string" ? search.courseId : "all"
  const selectedTeacherId = typeof search.teacherId === "string" ? search.teacherId : "all"

  const [bulkSheetOpen, setBulkSheetOpen] = useState(false)
  const [bulkCourseId, setBulkCourseId] = useState("")
  const [bulkTeacherId, setBulkTeacherId] = useState("")
  const [bulkCapacity, setBulkCapacity] = useState("10")
  const [bulkSelectedSlots, setBulkSelectedSlots] = useState<PreferredSlotSelection>({})

  const [singleSheetOpen, setSingleSheetOpen] = useState(false)
  const [editingClassroomSlot, setEditingClassroomSlot] = useState<ClassroomSlot | null>(null)
  const [singleCourseId, setSingleCourseId] = useState("")
  const [singleTeacherId, setSingleTeacherId] = useState("")
  const [singleTimeSlotId, setSingleTimeSlotId] = useState("")
  const [singleCapacity, setSingleCapacity] = useState("10")

  const setSearchParams = (patch: Record<string, unknown>) => {
    navigate({
      to: "/classroom",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        ...patch,
      }),
      replace: true,
    })
  }

  const settingsConfigQuery = useQuery({
    queryKey: ["settings-config", "classroom"],
    enabled: canView,
    queryFn: async (): Promise<SettingsConfigResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/settings/config`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load settings config")
      }
      return response.json()
    },
  })

  const dashboardQuery = useQuery({
    queryKey: ["classroom-dashboard", selectedDay, selectedCourseId, selectedTeacherId],
    enabled: canView,
    queryFn: async () => {
      const params = new URLSearchParams({ day: String(selectedDay) })
      if (selectedCourseId !== "all") {
        params.set("courseId", selectedCourseId)
      }
      if (selectedTeacherId !== "all") {
        params.set("teacherId", selectedTeacherId)
      }
      const response = await fetch(`${apiUrl}/api/v1/classroom-dashboard?${params}`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load classroom dashboard")
      }
      return response.json() as Promise<{ data: DashboardGroup[] }>
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
      return response.json() as Promise<{ data: CourseOption[] }>
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
      return response.json() as Promise<{ data: TeacherOption[] }>
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

  const createBulkClassroomSlotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId: bulkCourseId,
          teacherId: bulkTeacherId,
          capacity: Number(bulkCapacity),
          slotSelections: bulkSelectedSlots,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to create bulk classroom allocations")
      }
      return response.json() as Promise<{ data: { created: number; updated: number; total: number } }>
    },
    onSuccess: async (result) => {
      setBulkCourseId("")
      setBulkTeacherId("")
      setBulkCapacity("10")
      setBulkSelectedSlots({})
      setBulkSheetOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-slots", "classroom"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success(`Bulk allocation saved (${result.data.created} created, ${result.data.updated} updated)`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to save bulk classroom allocations."))
    },
  })

  const updateClassroomSlotMutation = useMutation({
    mutationFn: async () => {
      if (!editingClassroomSlot) {
        return
      }

      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/${editingClassroomSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId: singleCourseId,
          teacherId: singleTeacherId,
          timeSlotId: singleTimeSlotId,
          capacity: Number(singleCapacity),
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to update classroom slot")
      }
    },
    onSuccess: async () => {
      setSingleSheetOpen(false)
      setEditingClassroomSlot(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-slots", "classroom"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success("Classroom allocation updated")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update classroom allocation."))
    },
  })

  const archiveClassroomSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: false }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to archive classroom slot")
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-slots", "classroom"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success("Classroom allocation archived")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to archive classroom allocation."))
    },
  })

  const deleteClassroomSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/${id}?hardDelete=true`, {
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
        queryClient.invalidateQueries({ queryKey: ["classroom-slots", "classroom"] }),
        queryClient.invalidateQueries({ queryKey: ["classroom-dashboard"] }),
      ])
      toast.success("Classroom allocation deleted")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete classroom allocation."))
    },
  })

  useEffect(() => {
    if (dashboardQuery.isError) {
      toast.error(getErrorMessage(dashboardQuery.error, "Unable to load classroom dashboard."))
    }
  }, [dashboardQuery.error, dashboardQuery.isError])

  useEffect(() => {
    if (!search.tab || !search.date) {
      setSearchParams({
        tab: activeTab,
        date: selectedDateText,
        courseId: selectedCourseId,
        teacherId: selectedTeacherId,
      })
    }
  }, [activeTab, search.date, search.tab, selectedCourseId, selectedDateText, selectedTeacherId])

  useEffect(() => {
    if (!editingClassroomSlot) {
      return
    }

    setSingleCourseId(editingClassroomSlot.courseId)
    setSingleTeacherId(editingClassroomSlot.teacherId)
    setSingleTimeSlotId(editingClassroomSlot.timeSlot?.id ?? "")
    setSingleCapacity(String(editingClassroomSlot.capacity))
  }, [editingClassroomSlot])

  const tabs = useMemo(
    () =>
      [
        { value: "dashboard", label: "Dashboard", visible: canView },
        { value: "attendance", label: "Attendance", visible: canView },
        { value: "enrollments", label: "Enrollments", visible: canView },
        { value: "config", label: "Config", visible: canManage },
      ].filter((tab) => tab.visible),
    [canManage, canView]
  )

  const dashboardSlots = useMemo(() => {
    const slots: DashboardSlot[] = []

    for (const group of dashboardQuery.data?.data ?? []) {
      for (const slot of group.slots) {
        slots.push({
          ...slot,
          timeSlot: group.timeSlot,
        })
      }
    }

    return slots.sort((a, b) => {
      const aStart = a.timeSlot?.startTime ?? ""
      const bStart = b.timeSlot?.startTime ?? ""
      return aStart.localeCompare(bStart)
    })
  }, [dashboardQuery.data?.data])

  const bulkSelectedCount = useMemo(
    () => Object.values(bulkSelectedSlots).reduce((acc, items) => acc + items.length, 0),
    [bulkSelectedSlots]
  )

  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = []
    for (const day of settingsConfigQuery.data?.data ?? []) {
      if (!day.isOpen) {
        continue
      }
      for (const slot of day.slots) {
        slots.push({
          id: slot.id,
          dayOfWeek: day.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: 60,
          isActive: true,
        })
      }
    }
    return slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
  }, [settingsConfigQuery.data?.data])

  const bulkDays = useMemo(
    () =>
      (settingsConfigQuery.data?.data ?? [])
        .filter((day) => day.isOpen)
        .map((day) => ({ id: day.dayOfWeek, label: dayLabels[day.dayOfWeek]?.slice(0, 3) ?? `D${day.dayOfWeek}` })),
    [settingsConfigQuery.data?.data]
  )

  const allocatedByTimeSlot = useMemo(() => {
    const map = new Map<string, boolean>()
    if (!bulkCourseId || !bulkTeacherId) {
      return map
    }

    for (const slot of classroomSlotsQuery.data?.data ?? []) {
      if (!slot.isActive || !slot.timeSlot?.id) {
        continue
      }
      if (slot.courseId === bulkCourseId && slot.teacherId === bulkTeacherId) {
        map.set(slot.timeSlot.id, true)
      }
    }

    return map
  }, [bulkCourseId, bulkTeacherId, classroomSlotsQuery.data?.data])

  const bulkSlotsByDay = useMemo(() => {
    const grouped: Record<number, Array<{ id: string; label: string; allocated?: boolean }>> = {}
    for (const slot of timeSlots) {
      const items = grouped[slot.dayOfWeek] ?? []
      items.push({
        id: slot.id,
        label: formatTimeLabel(slot.startTime),
        allocated: allocatedByTimeSlot.get(slot.id) === true,
      })
      grouped[slot.dayOfWeek] = items
    }
    return grouped
  }, [allocatedByTimeSlot, timeSlots])

  const allocatedDayLabels = useMemo(() => {
    if (!bulkCourseId || !bulkTeacherId) {
      return [] as string[]
    }

    const daySet = new Set<number>()
    for (const slot of classroomSlotsQuery.data?.data ?? []) {
      if (!slot.isActive || slot.courseId !== bulkCourseId || slot.teacherId !== bulkTeacherId) {
        continue
      }
      if (typeof slot.timeSlot?.dayOfWeek === "number") {
        daySet.add(slot.timeSlot.dayOfWeek)
      }
    }

    return Array.from(daySet)
      .sort((a, b) => a - b)
      .map((day) => dayLabels[day])
      .filter(Boolean)
  }, [bulkCourseId, bulkTeacherId, classroomSlotsQuery.data?.data])

  const teacherFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: Array<{ label: string; value: string }> = []

    for (const teacher of teachersQuery.data?.data ?? []) {
      if (seen.has(teacher.id)) {
        continue
      }
      seen.add(teacher.id)
      options.push({ label: formatPersonName(teacher), value: teacher.id })
    }

    return options
  }, [teachersQuery.data?.data])

  const rescheduleColumns = useMemo(
    () =>
      createRescheduleColumns({
        canManage,
        onApprove: (id) => updateRescheduleMutation.mutate({ id, status: "approved" }),
        onReject: (id) => updateRescheduleMutation.mutate({ id, status: "rejected" }),
      }),
    [canManage, updateRescheduleMutation]
  )

  const classroomSlotColumns = useMemo(
    () =>
      createClassroomSlotColumns({
        onUpdate: (row) => {
          setEditingClassroomSlot(row)
          setSingleSheetOpen(true)
        },
        onArchive: (id) => archiveClassroomSlotMutation.mutate(id),
        onDelete: (id) => deleteClassroomSlotMutation.mutate(id),
      }),
    [archiveClassroomSlotMutation, deleteClassroomSlotMutation]
  )

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
        <p className="text-sm text-muted-foreground">Track class schedules, teachers, and student occupancy.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
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
              <CardDescription>Review weekly classes by course and teacher, then open a class to manage attendance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <WeekPicker
                  currentDate={selectedDate}
                  highlightDate={selectedDate}
                  onSelectDate={(date) => setSearchParams({ date: format(date, "yyyy-MM-dd") })}
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {dashboardSlots.map((slot, index) => (
                    <ClassCard
                      key={slot.id}
                      index={index}
                      slot={slot}
                      onClick={() => {
                        navigate({
                          to: `/classroom/class/${slot.id}`,
                          search: { date: selectedDateText, classNo: String(index + 1) },
                        })
                      }}
                    />
                  ))}
                </div>

                {!dashboardSlots.length && !dashboardQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">No classes found for the selected date and filters.</p>
                ) : null}
              </div>

              <DashboardFilters
                courses={coursesQuery.data?.data ?? []}
                teachers={teachersQuery.data?.data ?? []}
                selectedCourseId={selectedCourseId}
                onCourseChange={(value) => setSearchParams({ courseId: value })}
                selectedTeacherId={selectedTeacherId}
                onTeacherChange={(value) => setSearchParams({ teacherId: value })}
                selectedDate={selectedDate}
                onDateChange={(date) => setSearchParams({ date: format(date, "yyyy-MM-dd") })}
              />
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
              <DataTable
                columns={rescheduleColumns}
                data={rescheduleQuery.data?.data ?? []}
                searchableColumnIds={["student_id"]}
                searchPlaceholder="Search by student id"
                filters={[{ title: "Status", columnId: "status", options: [{ label: "Pending", value: "pending" }] }]}
                isLoading={rescheduleQuery.isLoading}
                loadingMessage="Loading pending requests..."
                emptyMessage="No pending requests."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment actions</CardTitle>
              <CardDescription>Open a class from Dashboard to update attendance and student statuses.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classroom allocations</CardTitle>
              <CardDescription>
                Manage allocations in bulk. Use row actions to update or archive individual entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setBulkSheetOpen(true)}>
                  Bulk allocation
                </Button>
              </div>

              <DataTable
                columns={classroomSlotColumns}
                data={classroomSlotsQuery.data?.data ?? []}
                searchableColumnIds={["course_name", "teacher_name", "day_time"]}
                searchPlaceholder="Search by course, teacher or day"
                filters={[
                  {
                    title: "Teacher",
                    columnId: "teacher_id",
                    options: teacherFilterOptions,
                  },
                  {
                    title: "Status",
                    columnId: "status",
                    options: [
                      { label: "Active", value: "active" },
                      { label: "Archived", value: "archived" },
                    ],
                  },
                ]}
                initialColumnFilters={[{ id: "status", value: ["active"] }]}
                initialColumnVisibility={{ teacher_id: false }}
                isLoading={classroomSlotsQuery.isLoading}
                loadingMessage="Loading classroom allocations..."
                emptyMessage="No classroom allocations found."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClassroomBulkAllocationSheet
        open={bulkSheetOpen}
        onOpenChange={setBulkSheetOpen}
        courses={coursesQuery.data?.data ?? []}
        teachers={teachersQuery.data?.data ?? []}
        courseId={bulkCourseId}
        setCourseId={setBulkCourseId}
        teacherId={bulkTeacherId}
        setTeacherId={setBulkTeacherId}
        capacity={bulkCapacity}
        setCapacity={setBulkCapacity}
        days={bulkDays}
        slotsByDay={bulkSlotsByDay}
        selectedSlots={bulkSelectedSlots}
        setSelectedSlots={setBulkSelectedSlots}
        selectedCount={bulkSelectedCount}
        allocatedDayLabels={allocatedDayLabels}
        onSave={() => createBulkClassroomSlotMutation.mutate()}
        isSaving={createBulkClassroomSlotMutation.isPending}
      />

      <ClassroomSingleAllocationSheet
        open={singleSheetOpen}
        onOpenChange={(open) => {
          setSingleSheetOpen(open)
          if (!open) {
            setEditingClassroomSlot(null)
          }
        }}
        courseId={singleCourseId}
        setCourseId={setSingleCourseId}
        teacherId={singleTeacherId}
        setTeacherId={setSingleTeacherId}
        timeSlotId={singleTimeSlotId}
        setTimeSlotId={setSingleTimeSlotId}
        capacity={singleCapacity}
        setCapacity={setSingleCapacity}
        courses={coursesQuery.data?.data ?? []}
        teachers={teachersQuery.data?.data ?? []}
        timeSlots={timeSlots}
        onSave={() => updateClassroomSlotMutation.mutate()}
        isSaving={updateClassroomSlotMutation.isPending}
      />
    </div>
  )
}
