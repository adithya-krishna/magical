import { useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import type { CoursePlan } from "@/pages/admissions/types"

const coursePlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.coerce.number().int().min(0, "Price must be >= 0"),
  durationMonths: z.coerce.number().int().min(1, "Duration must be at least 1"),
  classesPerWeek: z.coerce.number().int().min(1, "Classes / week must be at least 1"),
  isActive: z.boolean(),
})

export type CoursePlanFormValues = z.infer<typeof coursePlanSchema>

type CoursePlanFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: CoursePlan | null
  isSaving: boolean
  onSubmit: (values: CoursePlanFormValues) => Promise<void>
}

function toFormValues(plan?: CoursePlan | null): CoursePlanFormValues {
  return {
    name: plan?.name ?? "",
    price: plan?.price ?? 0,
    durationMonths: plan?.durationMonths ?? 1,
    classesPerWeek: plan?.classesPerWeek ?? 2,
    isActive: plan?.isActive ?? true,
  }
}

export function CoursePlanFormSheet({ open, onOpenChange, plan, isSaving, onSubmit }: CoursePlanFormSheetProps) {
  const form = useForm({
    defaultValues: toFormValues(plan),
    onSubmit: async ({ value }) => {
      const parsed = coursePlanSchema.safeParse(value)
      if (!parsed.success) {
        return
      }
      await onSubmit(parsed.data)
    },
  })

  useEffect(() => {
    form.reset(toFormValues(plan))
  }, [form, plan, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{plan ? "Edit course plan" : "Create course plan"}</SheetTitle>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-plan-name">Plan Name</Label>
                <Input
                  id="course-plan-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          />

          <form.Field
            name="price"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-plan-price">Price (Minor Units)</Label>
                <Input
                  id="course-plan-price"
                  type="number"
                  min={0}
                  value={String(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(Number(event.target.value || 0))}
                />
              </div>
            )}
          />

          <form.Field
            name="durationMonths"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-plan-duration">Duration (Months)</Label>
                <Input
                  id="course-plan-duration"
                  type="number"
                  min={1}
                  value={String(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(Number(event.target.value || 1))}
                />
              </div>
            )}
          />

          <form.Field
            name="classesPerWeek"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="course-plan-classes">Classes / Week</Label>
                <Input
                  id="course-plan-classes"
                  type="number"
                  min={1}
                  value={String(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(Number(event.target.value || 1))}
                />
              </div>
            )}
          />

          <form.Field
            name="isActive"
            children={(field) => (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="course-plan-active">Active</Label>
                  <p className="text-xs text-muted-foreground">Enable this plan for admissions</p>
                </div>
                <Switch
                  id="course-plan-active"
                  checked={field.state.value}
                  onCheckedChange={(value) => field.handleChange(Boolean(value))}
                />
              </div>
            )}
          />

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : plan ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
