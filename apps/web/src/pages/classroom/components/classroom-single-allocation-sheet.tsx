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
import type { CourseOption, TeacherOption, TimeSlot } from "../types"
import { dayLabels, formatPersonName, formatTimeLabel } from "../utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  setCourseId: (value: string) => void
  teacherId: string
  setTeacherId: (value: string) => void
  timeSlotId: string
  setTimeSlotId: (value: string) => void
  capacity: string
  setCapacity: (value: string) => void
  courses: CourseOption[]
  teachers: TeacherOption[]
  timeSlots: TimeSlot[]
  onSave: () => void
  isSaving: boolean
}

export function ClassroomSingleAllocationSheet({
  open,
  onOpenChange,
  courseId,
  setCourseId,
  teacherId,
  setTeacherId,
  timeSlotId,
  setTimeSlotId,
  capacity,
  setCapacity,
  courses,
  teachers,
  timeSlots,
  onSave,
  isSaving,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Update allocation</SheetTitle>
          <SheetDescription>
            Update course, teacher, time slot, and capacity for this classroom allocation.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Course</p>
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
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Teacher</p>
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
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Time slot</p>
            <Select value={timeSlotId} onValueChange={setTimeSlotId}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots
                  .filter((slot) => slot.isActive)
                  .map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {dayLabels[slot.dayOfWeek]} {formatTimeLabel(slot.startTime)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Capacity</p>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Capacity"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!courseId || !teacherId || !timeSlotId || Number(capacity) < 1 || isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
