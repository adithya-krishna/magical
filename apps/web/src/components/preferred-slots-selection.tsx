import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type PreferredSlotSelection = Record<number, string[]>

type PreferredSlotDay = {
  id: number
  label: string
}

type PreferredSlotOption = {
  id: string
  label: string
  disabled?: boolean
  hint?: string
  allocated?: boolean
}

interface PreferredSlotSelectProps {
  days: PreferredSlotDay[]
  slotsByDay: Record<number, PreferredSlotOption[]>
  selectedSlots: PreferredSlotSelection
  setSlotsAction: (slots: PreferredSlotSelection) => void
  disabled?: boolean
}

export default function PreferredSlotSelect({
  days,
  slotsByDay,
  selectedSlots,
  setSlotsAction,
  disabled = false,
}: PreferredSlotSelectProps) {
  const [activeDay, setActiveDay] = useState<string>(days[0] ? String(days[0].id) : "")

  useEffect(() => {
    if (!days.length) {
      setActiveDay("")
      return
    }

    setActiveDay((current) => {
      if (days.some((day) => String(day.id) === current)) {
        return current
      }

      return String(days[0].id)
    })
  }, [days])

  const gridClass = useMemo(() => {
    if (days.length <= 1) return "grid-cols-1"
    if (days.length === 2) return "grid-cols-2"
    if (days.length === 3) return "grid-cols-3"
    if (days.length === 4) return "grid-cols-4"
    if (days.length === 5) return "grid-cols-5"
    if (days.length === 6) return "grid-cols-6"
    return "grid-cols-7"
  }, [days.length])

  const handleTimeSlotToggle = (dayId: number, slotId: string, slotDisabled: boolean) => {
    if (disabled || slotDisabled) {
      return
    }

    const currentDaySlots = selectedSlots[dayId] ?? []
    const nextDaySlots = currentDaySlots.includes(slotId)
      ? currentDaySlots.filter((id) => id !== slotId)
      : [...currentDaySlots, slotId]

    const next = { ...selectedSlots, [dayId]: nextDaySlots }
    if (next[dayId]?.length === 0) {
      delete next[dayId]
    }

    setSlotsAction(next)
  }

  if (!days.length) {
    return <p className="text-sm text-muted-foreground">No operating days configured.</p>
  }

  return (
    <div className="w-full">
      <Tabs value={activeDay} onValueChange={setActiveDay} className="w-full">
        <TabsList className={cn("grid w-full", gridClass)}>
          {days.map((day) => {
            const daySlots = slotsByDay[day.id] ?? []
            const hasAllocatedSlot = daySlots.some((slot) => slot.allocated)
            const hasSelection = (selectedSlots[day.id]?.length ?? 0) > 0

            return (
            <TabsTrigger
              key={day.id}
              value={String(day.id)}
              className="relative flex items-center justify-center"
              disabled={disabled}
            >
              <span className="flex items-center gap-1.5">
                {hasSelection || hasAllocatedSlot ? <span className="h-2 w-2 rounded-full bg-green-500" /> : null}
                <span>{day.label}</span>
              </span>
            </TabsTrigger>
            )
          })}
        </TabsList>

        {days.map((day) => {
          const daySlots = slotsByDay[day.id] ?? []
          return (
            <TabsContent key={day.id} value={String(day.id)} className="mt-3">
              {daySlots.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {daySlots.map((slot) => {
                    const isSelected = selectedSlots[day.id]?.includes(slot.id) ?? false
                    const isAllocated = Boolean(slot.allocated)
                    const isDisabled = Boolean(disabled || slot.disabled)

                    return (
                      <Button
                        key={slot.id}
                        type="button"
                        variant={isSelected ? "default" : isAllocated ? "outline" : "ghost"}
                        onClick={() => handleTimeSlotToggle(day.id, slot.id, isDisabled)}
                        disabled={isDisabled}
                        className={cn(
                          "h-auto min-h-10 flex-col items-start gap-0.5 px-3 py-2 text-left",
                          isDisabled && "cursor-not-allowed opacity-45"
                        )}
                      >
                        <span className="w-full truncate text-sm">{slot.label}</span>
                        {slot.hint ? <span className="w-full truncate text-[11px] opacity-80">{slot.hint}</span> : null}
                      </Button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No time slots configured for this day.</p>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
