import { addDays, format, isSameDay, startOfWeek } from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WeekPickerProps = {
  currentDate: Date
  highlightDate: Date
  filterDays?: number[]
  onSelectDate: (date: Date) => void
}

export function WeekPicker({ currentDate, highlightDate, filterDays = [], onSelectDate }: WeekPickerProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  return (
    <div className="grid grid-cols-7 gap-2">
      {days
        .filter((day) => !filterDays.includes(day.getDay()))
        .map((day) => {
          const isActive = isSameDay(day, highlightDate)
          return (
            <Button
              key={format(day, "yyyy-MM-dd")}
              variant={isActive ? "default" : "ghost"}
              className={cn("h-auto cursor-pointer flex-col px-3 py-1.5", isActive ? "font-semibold" : "font-normal")}
              aria-current={isActive ? "date" : undefined}
              type="button"
              onClick={() => onSelectDate(day)}
            >
              <span>{format(day, "EEEEEE")}</span>
              <span>{format(day, "dd")}</span>
            </Button>
          )
        })}
    </div>
  )
}
