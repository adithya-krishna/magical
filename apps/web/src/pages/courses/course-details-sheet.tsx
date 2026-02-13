import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { Course, CourseTeacher, TeacherOption } from "@/pages/courses/types"

type CourseDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course | null
  teachers: CourseTeacher[]
  teacherOptions: TeacherOption[]
  canManage: boolean
  onAssignTeacher: (teacherId: string) => Promise<void>
  onRemoveTeacher: (teacherId: string) => Promise<void>
}

export function CourseDetailsSheet({
  open,
  onOpenChange,
  course,
  teachers,
  teacherOptions,
  canManage,
  onAssignTeacher,
  onRemoveTeacher,
}: CourseDetailsSheetProps) {
  const [teacherToAssign, setTeacherToAssign] = useState("")

  const assignedIds = useMemo(() => new Set(teachers.map((item) => item.teacherId)), [teachers])

  const assignableTeachers = teacherOptions.filter((teacher) => !assignedIds.has(teacher.id))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{course?.name ?? "Course details"}</SheetTitle>
          <SheetDescription>Difficulty, instrument, and teacher assignment details.</SheetDescription>
        </SheetHeader>

        {course ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-md border p-4 text-sm">
              <p>
                <span className="font-medium">Instrument:</span> {course.instrumentName}
              </p>
              <p className="mt-1">
                <span className="font-medium">Difficulty:</span> {course.difficulty}
              </p>
              <p className="mt-1">
                <span className="font-medium">Status:</span> {course.isActive ? "Active" : "Archived"}
              </p>
              <p className="mt-2 text-muted-foreground">{course.description || "No description"}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Assigned teachers</Label>
                <Badge variant="outline">{teachers.length}</Badge>
              </div>

              {canManage ? (
                <div className="flex items-center gap-2">
                  <Select value={teacherToAssign} onValueChange={setTeacherToAssign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={async () => {
                      if (!teacherToAssign) {
                        return
                      }
                      await onAssignTeacher(teacherToAssign)
                      setTeacherToAssign("")
                    }}
                    disabled={!teacherToAssign}
                  >
                    Assign
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                {teachers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No teachers assigned.</p>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.teacherId}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="text-muted-foreground">{teacher.email}</p>
                      </div>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => onRemoveTeacher(teacher.teacherId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
