import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { format, parse } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClassDetailTable } from "@/pages/classroom/components/class-detail-table"
import type { AttendanceRow, ClassroomSlot } from "@/pages/classroom/types"
import { formatPersonName, formatTimeLabel, getErrorMessage } from "@/pages/classroom/utils"

function getDateFromSearch(raw?: unknown) {
  if (typeof raw !== "string" || !raw) {
    return format(new Date(), "yyyy-MM-dd")
  }

  const parsed = parse(raw, "yyyy-MM-dd", new Date())
  if (Number.isNaN(parsed.getTime())) {
    return format(new Date(), "yyyy-MM-dd")
  }

  return format(parsed, "yyyy-MM-dd")
}

export function ClassroomClassDetailPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { slotId: string }
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const selectedDate = getDateFromSearch(search.date)
  const classNo = typeof search.classNo === "string" ? search.classNo : undefined

  const classroomSlotQuery = useQuery({
    queryKey: ["classroom-slot", params.slotId],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/classroom-slots/${params.slotId}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load class")
      }
      return response.json() as Promise<{ data: ClassroomSlot }>
    },
  })

  const attendanceQuery = useQuery({
    queryKey: ["classroom-attendance", params.slotId, selectedDate],
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/api/v1/classrooms/${params.slotId}/attendance?date=${selectedDate}`,
        { credentials: "include" }
      )
      if (!response.ok) {
        throw new Error("Failed to load attendance")
      }
      return response.json() as Promise<{ data: AttendanceRow[] }>
    },
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, status }: { attendanceId: string; status: AttendanceRow["attendance"]["status"] }) => {
      const response = await fetch(`${apiUrl}/api/v1/classrooms/${params.slotId}/attendance/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "Failed to update attendance")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-attendance", params.slotId, selectedDate] })
      toast.success("Attendance updated")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update attendance."))
    },
  })

  const titleText = useMemo(() => {
    return classNo ? `Class ${classNo}` : "Class"
  }, [classNo])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{titleText}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {classroomSlotQuery.data?.data.timeSlot
              ? `${formatTimeLabel(classroomSlotQuery.data.data.timeSlot.startTime)} to ${formatTimeLabel(classroomSlotQuery.data.data.timeSlot.endTime)}`
              : "Time unavailable"}
          </p>
          <p className="text-sm text-muted-foreground">
            Teacher: {formatPersonName(classroomSlotQuery.data?.data.teacher ?? undefined)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-1">
            <Label htmlFor="class-detail-date">Date</Label>
            <Input
              id="class-detail-date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                navigate({
                  to: `/classroom/class/${params.slotId}`,
                  search: (prev: Record<string, unknown>) => ({
                    ...prev,
                    date: event.target.value,
                    classNo,
                  }),
                })
              }}
            />
          </div>

          <ClassDetailTable
            rows={attendanceQuery.data?.data ?? []}
            onUpdateStatus={(attendanceId, status) => updateAttendanceMutation.mutate({ attendanceId, status })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
