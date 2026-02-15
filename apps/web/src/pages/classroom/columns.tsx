import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClassroomAllocationRowActions } from "./components/classroom-allocation-row-actions"
import type { ClassroomSlot, RescheduleRow } from "./types"
import { formatDayTime, formatPersonName } from "./utils"

type RescheduleConfig = {
  canManage: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function createRescheduleColumns({ canManage, onApprove, onReject }: RescheduleConfig) {
  const columns: ColumnDef<RescheduleRow>[] = [
    {
      id: "requested_date",
      accessorKey: "requestedDate",
      header: "Requested date",
    },
    {
      id: "student_id",
      accessorKey: "studentId",
      header: "Student",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.studentId}</span>,
    },
    {
      id: "status",
      accessorKey: "status",
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues) ? (filterValues as string[]) : []
        if (!selected.length) return true
        return selected.includes(String(row.getValue(columnId)))
      },
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      id: "created_at",
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                onReject(row.original.id)
              }}
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                onApprove(row.original.id)
              }}
            >
              Approve
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">View only</span>
        ),
    },
  ]

  return columns
}

type ClassroomColumnsConfig = {
  onUpdate: (row: ClassroomSlot) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function createClassroomSlotColumns({ onUpdate, onArchive, onDelete }: ClassroomColumnsConfig) {
  const columns: ColumnDef<ClassroomSlot>[] = [
    {
      id: "day_time",
      accessorFn: (row) => {
        const { day, time } = formatDayTime(
          row.timeSlot?.dayOfWeek,
          row.timeSlot?.startTime,
          row.timeSlot?.endTime
        )
        return `${day} ${time}`
      },
      cell: ({ row }) => {
        const { day, time } = formatDayTime(
          row.original.timeSlot?.dayOfWeek,
          row.original.timeSlot?.startTime,
          row.original.timeSlot?.endTime
        )
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">{day}</div>
            <div className="text-xs text-muted-foreground">{time}</div>
          </div>
        )
      },
      header: "Day / Time",
    },
    {
      id: "course_name",
      accessorFn: (row) => row.course?.name ?? "-",
      header: "Course",
    },
    {
      id: "teacher_id",
      accessorFn: (row) => row.teacherId,
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues) ? (filterValues as string[]) : []
        if (!selected.length) return true
        return selected.includes(String(row.getValue(columnId)))
      },
      header: "Teacher Id",
    },
    {
      id: "teacher_name",
      accessorFn: (row) => formatPersonName(row.teacher ?? undefined),
      header: "Teacher",
    },
    {
      id: "utilization",
      accessorFn: (row) => `${row.occupancy}/${row.capacity}`,
      header: "Occupancy",
    },
    {
      id: "status",
      accessorFn: (row) => (row.isActive ? "active" : "archived"),
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues) ? (filterValues as string[]) : []
        if (!selected.length) return true
        return selected.includes(String(row.getValue(columnId)))
      },
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "secondary" : "outline"}>
          {row.original.isActive ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ClassroomAllocationRowActions
          label={row.original.course?.name ?? row.original.id}
          isActive={row.original.isActive}
          onUpdate={() => onUpdate(row.original)}
          onArchive={() => onArchive(row.original.id)}
          onDelete={() => onDelete(row.original.id)}
        />
      ),
    },
  ]

  return columns
}
