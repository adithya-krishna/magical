import PreferredSlotSelect, { type PreferredSlotSelection } from "@/components/preferred-slots-selection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import type { CourseOption, TeacherOption } from "../types"
import { formatPersonName } from "../utils"

type SlotOption = { id: string; label: string; hint?: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: CourseOption[]
  teachers: TeacherOption[]
  courseId: string
  setCourseId: (value: string) => void
  teacherId: string
  setTeacherId: (value: string) => void
  capacity: string
  setCapacity: (value: string) => void
  days: Array<{ id: number; label: string }>
  slotsByDay: Record<number, SlotOption[]>
  selectedSlots: PreferredSlotSelection
  setSelectedSlots: (value: PreferredSlotSelection) => void
  selectedCount: number
  allocatedDayLabels: string[]
  onSave: () => void
  isSaving: boolean
}

export function ClassroomBulkAllocationSheet({
  open,
  onOpenChange,
  courses,
  teachers,
  courseId,
  setCourseId,
  teacherId,
  setTeacherId,
  capacity,
  setCapacity,
  days,
  slotsByDay,
  selectedSlots,
  setSelectedSlots,
  selectedCount,
  allocatedDayLabels,
  onSave,
  isSaving,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Classroom allocation</SheetTitle>
          <SheetDescription>
            Select course, teacher, and weekly slots to bulk create or update allocations.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {formatPersonName(teacher)}
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
          </div>

          {allocatedDayLabels.length ? (
            <p className="text-xs text-muted-foreground">
              Existing allocations for this course + teacher: {allocatedDayLabels.join(", ")}
            </p>
          ) : null}

          <div className="rounded-md border p-3">
            <PreferredSlotSelect
              days={days}
              slotsByDay={slotsByDay}
              selectedSlots={selectedSlots}
              setSlotsAction={setSelectedSlots}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Selected slots: {selectedCount}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={
                  !courseId ||
                  !teacherId ||
                  Number(capacity) < 1 ||
                  selectedCount < 1 ||
                  isSaving
                }
              >
                {isSaving ? "Saving..." : "Save allocations"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
