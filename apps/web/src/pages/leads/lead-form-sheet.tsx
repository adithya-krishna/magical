import { useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
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
  leadFormSchema,
  toLeadFormValues,
  toLeadPayload,
  type Lead,
  type LeadFormValues,
  type LeadStage,
} from "@/pages/leads/types"

function getFieldError(error: unknown): string | null {
  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === "string" ? message : null
  }

  return null
}

type LeadFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  stages: LeadStage[]
  isSaving: boolean
  onSubmit: (values: LeadFormValues) => Promise<void>
}

export function LeadFormSheet({
  open,
  onOpenChange,
  lead,
  stages,
  isSaving,
  onSubmit,
}: LeadFormSheetProps) {
  const form = useForm({
    defaultValues: toLeadFormValues(lead),
    onSubmit: async ({ value }) => {
      const parsed = leadFormSchema.safeParse(value)
      if (!parsed.success) {
        return
      }

      await onSubmit(parsed.data)
    },
  })

  useEffect(() => {
    form.reset(toLeadFormValues(lead))
  }, [form, lead, open])

  const isEdit = Boolean(lead)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Update lead" : "Create lead"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update lead details and follow-up information."
              : "Capture a new lead and add follow-up details."}
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <form.Field
              name="firstName"
              validators={{
                onChange: ({ value }) => {
                  const result = leadFormSchema.shape.firstName.safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-first-name">First name</Label>
                  <Input
                    id="lead-first-name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="text-xs text-destructive">
                      {getFieldError(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="lastName"
              validators={{
                onChange: ({ value }) => {
                  const result = leadFormSchema.shape.lastName.safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-last-name">Last name</Label>
                  <Input
                    id="lead-last-name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="text-xs text-destructive">
                      {getFieldError(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <form.Field
            name="phone"
            validators={{
              onChange: ({ value }) => {
                const result = leadFormSchema.shape.phone.safeParse(value)
                return result.success ? undefined : result.error.issues[0]?.message
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <PhoneInput
                  id="lead-phone"
                  defaultCountry="IN"
                  international
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(value) => field.handleChange(value ?? "")}
                  disabled={isSaving}
                />
                {field.state.meta.errors[0] ? (
                  <p className="text-xs text-destructive">
                    {getFieldError(field.state.meta.errors[0])}
                  </p>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                const result = leadFormSchema.shape.email.safeParse(value)
                return result.success ? undefined : result.error.issues[0]?.message
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={isSaving}
                />
                {field.state.meta.errors[0] ? (
                  <p className="text-xs text-destructive">
                    {getFieldError(field.state.meta.errors[0])}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field
              name="area"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-area">Area</Label>
                  <Input
                    id="lead-area"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
              )}
            />

            <form.Field
              name="community"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-community">Community</Label>
                  <Input
                    id="lead-community"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field
              name="age"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-age">Age</Label>
                  <Input
                    id="lead-age"
                    type="number"
                    min={0}
                    max={120}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.target.value ? Number(event.target.value) : null)
                    }
                    disabled={isSaving}
                  />
                </div>
              )}
            />

            <form.Field
              name="expectedBudget"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-expected-budget">Expected budget</Label>
                  <Input
                    id="lead-expected-budget"
                    type="number"
                    min={0}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(Number(event.target.value || 0))}
                    disabled={isSaving}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field
              name="stageId"
              validators={{
                onChange: ({ value }) => {
                  const result = leadFormSchema.shape.stageId.safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                },
              }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-stage">Stage</Label>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id="lead-stage" disabled={isSaving}>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors[0] ? (
                    <p className="text-xs text-destructive">
                      {getFieldError(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="followUpStatus"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-follow-up-status">Follow-up status</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as "open" | "done")}
                  >
                    <SelectTrigger id="lead-follow-up-status" disabled={isSaving}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <form.Field
            name="followUpDate"
            validators={{
              onChange: ({ value }) => {
                const result = leadFormSchema.shape.followUpDate.safeParse(value)
                return result.success ? undefined : result.error.issues[0]?.message
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="lead-follow-up-date">Follow-up date</Label>
                <Input
                  id="lead-follow-up-date"
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={isSaving}
                />
                {field.state.meta.errors[0] ? (
                  <p className="text-xs text-destructive">
                    {getFieldError(field.state.meta.errors[0])}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field
              name="interest"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-interest">Interest</Label>
                  <Input
                    id="lead-interest"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
              )}
            />

            <form.Field
              name="source"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lead-source">Source</Label>
                  <Input
                    id="lead-source"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isSaving}
                  />
                </div>
              )}
            />
          </div>

          <form.Field
            name="notes"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea
                  id="lead-notes"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={isSaving}
                  rows={4}
                />
              </div>
            )}
          />

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create lead"}
            </Button>
          </SheetFooter>

          <form.Subscribe
            selector={(state) => ({
              submitCount: state.submissionAttempts,
              values: state.values,
            })}
            children={({ submitCount, values }) => {
              if (submitCount < 1) {
                return null
              }

              const parsed = leadFormSchema.safeParse(values)
              if (parsed.success) {
                return null
              }

              return (
                <p className="text-sm text-destructive">
                  {parsed.error.issues[0]?.message ?? "Please review the form fields."}
                </p>
              )
            }}
          />
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function mapLeadFormToPayload(values: LeadFormValues) {
  return toLeadPayload(values)
}
