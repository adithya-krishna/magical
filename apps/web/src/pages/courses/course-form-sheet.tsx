import { useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  courseFormSchema,
  toCourseFormValues,
  type Course,
  type CourseFormValues,
  type InstrumentOption,
} from "@/pages/courses/types"

type CourseFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course | null
  instruments: InstrumentOption[]
  isSaving: boolean
  onSubmit: (values: CourseFormValues) => Promise<void>
}

export function CourseFormSheet({
  open,
  onOpenChange,
  course,
  instruments,
  isSaving,
  onSubmit,
}: CourseFormSheetProps) {
  const form = useForm({
    defaultValues: toCourseFormValues(course),
    onSubmit: async ({ value }) => {
      const parsed = courseFormSchema.safeParse(value)
      if (!parsed.success) {
        return
      }
      await onSubmit(parsed.data)
    },
  })

  useEffect(() => {
    form.reset(toCourseFormValues(course))
  }, [form, course, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{course ? "Update course" : "Create course"}</SheetTitle>
          <SheetDescription>Set instrument, difficulty and teacher-ready status.</SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="instrumentId"
            children={(field) => (
              <div className="space-y-2">
                <Label>Instrument</Label>
                <Select value={field.state.value} onValueChange={field.handleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    {instruments
                      .filter((item) => item.isActive)
                      .map((instrument) => (
                        <SelectItem key={instrument.id} value={instrument.id}>
                          {instrument.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-name">Course name</Label>
                <Input
                  id="course-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          />

          <form.Field
            name="difficulty"
            children={(field) => (
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "beginner" | "intermediate" | "advanced")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-description">Description</Label>
                <Textarea
                  id="course-description"
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          />

          <form.Field
            name="isActive"
            children={(field) => (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={field.state.value ? "true" : "false"}
                  onValueChange={(value) => field.handleChange(value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : course ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
