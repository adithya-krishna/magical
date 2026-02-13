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
import {
  instrumentFormSchema,
  toInstrumentFormValues,
  type Instrument,
  type InstrumentFormValues,
} from "@/pages/instruments/types"

type InstrumentFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  instrument?: Instrument | null
  isSaving: boolean
  onSubmit: (values: InstrumentFormValues) => Promise<void>
}

export function InstrumentFormSheet({
  open,
  onOpenChange,
  instrument,
  isSaving,
  onSubmit,
}: InstrumentFormSheetProps) {
  const form = useForm({
    defaultValues: toInstrumentFormValues(instrument),
    onSubmit: async ({ value }) => {
      const parsed = instrumentFormSchema.safeParse(value)
      if (!parsed.success) {
        return
      }
      await onSubmit(parsed.data)
    },
  })

  useEffect(() => {
    form.reset(toInstrumentFormValues(instrument))
  }, [form, instrument, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{instrument ? "Update instrument" : "Create instrument"}</SheetTitle>
          <SheetDescription>Manage available instruments for courses.</SheetDescription>
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
                <Label htmlFor="instrument-name">Name</Label>
                <Input
                  id="instrument-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={isSaving}
                />
              </div>
            )}
          />

          <form.Field
            name="isActive"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="instrument-active">Status</Label>
                <Select
                  value={field.state.value ? "true" : "false"}
                  onValueChange={(value) => field.handleChange(value === "true")}
                >
                  <SelectTrigger id="instrument-active">
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
              {isSaving ? "Saving..." : instrument ? "Save changes" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
