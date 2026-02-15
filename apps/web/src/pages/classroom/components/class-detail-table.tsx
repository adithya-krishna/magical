import type { ReactNode } from "react"
import { CheckCircle2, Clock3, CircleSlash2, UserX2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { AttendanceRow } from "../types"
import { formatPersonName } from "../utils"

type Props = {
  rows: AttendanceRow[]
  onUpdateStatus: (attendanceId: string, status: AttendanceRow["attendance"]["status"]) => void
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" size="icon" variant="outline" onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ClassDetailTable({ rows, onUpdateStatus }: Props) {
  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Students</TableHead>
            <TableHead className="w-[320px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.attendance.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{formatPersonName(row.student ?? undefined)}</p>
                  <p className="text-xs text-muted-foreground">{row.student?.email || row.attendance.studentId}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <ActionButton
                    label="Present"
                    icon={<CheckCircle2 className="text-emerald-500" />}
                    onClick={() => onUpdateStatus(row.attendance.id, "present")}
                  />
                  <ActionButton
                    label="Absent"
                    icon={<UserX2 className="text-red-500" />}
                    onClick={() => onUpdateStatus(row.attendance.id, "absent")}
                  />
                  <ActionButton
                    label="Late"
                    icon={<Clock3 className="text-amber-500" />}
                    onClick={() => onUpdateStatus(row.attendance.id, "late")}
                  />
                  <ActionButton
                    label="Excused"
                    icon={<CircleSlash2 className="text-slate-500" />}
                    onClick={() => onUpdateStatus(row.attendance.id, "excused")}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
