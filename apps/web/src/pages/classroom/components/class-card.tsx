import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DashboardSlot } from "../types"
import { formatPersonName, formatTimeLabel } from "../utils"

type ClassCardProps = {
  index: number
  slot: DashboardSlot
  isActive?: boolean
  onClick: () => void
}

function OccupancyIndicator({ filled, total }: { filled: number; total: number }) {
  const max = Math.max(1, total)
  const items = Array.from({ length: max })

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((_, index) => (
        <span
          key={`occupancy-${index}`}
          className={cn(
            "h-2.5 w-2.5 rounded-sm border",
            index < filled ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
          )}
        />
      ))}
    </div>
  )
}

export function ClassCard({ index, slot, isActive = false, onClick }: ClassCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border p-4 text-left transition hover:bg-muted/30"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">Class {index + 1}</p>
        {isActive ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {formatTimeLabel(slot.timeSlot?.startTime)} to {formatTimeLabel(slot.timeSlot?.endTime)}
      </p>
      <p className="mt-2 text-sm">Teacher: {formatPersonName(slot.teacher ?? undefined)}</p>
      <p className="text-sm">Occupancy: {slot.occupancy}/{slot.capacity}</p>
      <div className="mt-2">
        <OccupancyIndicator filled={slot.occupancy} total={slot.capacity} />
      </div>
      <div className="mt-2">
        <Badge variant={slot.occupancy >= slot.capacity ? "destructive" : "secondary"}>
          {slot.occupancy >= slot.capacity ? "Full" : "Available"}
        </Badge>
      </div>
    </button>
  )
}
