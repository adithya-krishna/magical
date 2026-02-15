import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CourseOption, TeacherOption } from "../types"
import { formatPersonName } from "../utils"

type DashboardFiltersProps = {
  courses: CourseOption[]
  teachers: TeacherOption[]
  selectedCourseId: string
  onCourseChange: (value: string) => void
  selectedTeacherId: string
  onTeacherChange: (value: string) => void
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DashboardFilters({
  courses,
  teachers,
  selectedCourseId,
  onCourseChange,
  selectedTeacherId,
  onTeacherChange,
  selectedDate,
  onDateChange,
}: DashboardFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedCourseId} onValueChange={onCourseChange}>
          <SelectTrigger>
            <SelectValue placeholder="Change course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTeacherId} onValueChange={onTeacherChange}>
          <SelectTrigger>
            <SelectValue placeholder="Change teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teachers</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {formatPersonName(teacher)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-md border">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateChange(date)
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
