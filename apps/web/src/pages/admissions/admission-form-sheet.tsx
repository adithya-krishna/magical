import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatInrFromMinor, minorToMajor } from "@/lib/money"
import type {
  AdmissionPrerequisitesResponse,
} from "@/pages/admissions/types"

type CreateMode = "lead" | "walk_in"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (studentId?: string | null) => Promise<void> | void
  initialLeadId?: string | null
}

type ApiErrorBody = {
  error?: string
  details?: {
    capacityIssues?: Array<{ classroomSlotId: string; timeSlotId: string }>
  }
}

type OperationalPrerequisitesResponse = {
  data: Array<{
    dayOfWeek: number
    isOpen: boolean
    startTime: string | null
    endTime: string | null
    slots: Array<{ id: string; startTime: string; endTime: string }>
  }>
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10)
}

function dayName(day: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day] ?? `Day ${day}`
}

function formatClassStartLabel(startTime: string) {
  const [hourPart, minutePart] = startTime.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart)

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return `${startTime} (+1h)`
  }

  const meridiem = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const minuteText = minute.toString().padStart(2, "0")
  return `${hour12}:${minuteText} ${meridiem} (+1h)`
}

async function parseApiError(response: Response, fallback: string) {
  let body: ApiErrorBody | undefined
  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    return new Error(fallback)
  }

  const message = body?.error || fallback
  if (body?.details?.capacityIssues?.length) {
    return new Error(`${message}. One or more selected slots are full.`)
  }
  return new Error(message)
}

export function AdmissionFormSheet({ open, onOpenChange, onCreated, initialLeadId }: Props) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const [mode, setMode] = useState<CreateMode>("lead")
  const [leadId, setLeadId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [coursePlanId, setCoursePlanId] = useState("")
  const [startDate, setStartDate] = useState(getTodayIso())
  const [extraClasses, setExtraClasses] = useState("0")
  const [discountType, setDiscountType] = useState<"none" | "percent" | "amount">("none")
  const [discountValue, setDiscountValue] = useState("0")
  const [notes, setNotes] = useState("")
  const [slotRows, setSlotRows] = useState<Array<{ dayOfWeek: string; timeSlotId: string }>>([
    { dayOfWeek: "", timeSlotId: "" },
  ])

  const [walkInFirstName, setWalkInFirstName] = useState("")
  const [walkInLastName, setWalkInLastName] = useState("")
  const [walkInEmail, setWalkInEmail] = useState("")
  const [walkInPhone, setWalkInPhone] = useState("")
  const [walkInPassword, setWalkInPassword] = useState("")

  const prerequisitesQuery = useQuery({
    queryKey: ["admission-prerequisites", courseId],
    enabled: open,
    queryFn: async (): Promise<AdmissionPrerequisitesResponse> => {
      const params = new URLSearchParams()
      if (courseId) {
        params.set("courseId", courseId)
      }

      const response = await fetch(`${apiUrl}/api/v1/admissions/prerequisites?${params}`, {
        credentials: "include",
      })
      if (!response.ok) throw await parseApiError(response, "Failed to load admission prerequisites")
      return response.json()
    },
  })

  const operationsQuery = useQuery({
    queryKey: ["prerequisites"],
    enabled: open,
    queryFn: async (): Promise<OperationalPrerequisitesResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/prerequisites`, {
        credentials: "include",
      })
      if (!response.ok) throw await parseApiError(response, "Failed to load prerequisites")
      return response.json()
    },
  })

  const selectedPlan = (prerequisitesQuery.data?.data.coursePlans ?? []).find((plan) => plan.id === coursePlanId)
  const openDays = (operationsQuery.data?.data ?? []).filter((day) => day.isOpen)

  const slotOptionsByDay = useMemo(() => {
    const options = new Map<number, Array<{ id: string; label: string }>>()
    for (const slot of prerequisitesQuery.data?.data.slotOptions ?? []) {
      if (!slot.classroomSlotId) {
        continue
      }

      const existing = options.get(slot.dayOfWeek) ?? []
      existing.push({
        id: slot.timeSlotId,
        label: formatClassStartLabel(slot.startTime),
      })
      options.set(slot.dayOfWeek, existing)
    }
    return options
  }, [prerequisitesQuery.data?.data.slotOptions])

  useEffect(() => {
    if (open && initialLeadId) {
      setMode("lead")
      setLeadId(initialLeadId)
    }
  }, [open, initialLeadId])

  const selectedSlotCount = slotRows.filter((row) => row.dayOfWeek && row.timeSlotId).length
  const selectedSlotKeys = slotRows
    .filter((row) => row.dayOfWeek && row.timeSlotId)
    .map((row) => `${row.dayOfWeek}:${row.timeSlotId}`)
  const hasDuplicateSlots = new Set(selectedSlotKeys).size !== selectedSlotKeys.length

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) {
        throw new Error("Select a course plan")
      }

      if (selectedSlotCount !== selectedPlan.classesPerWeek) {
        throw new Error(`Select exactly ${selectedPlan.classesPerWeek} weekly slots`)
      }

      if (hasDuplicateSlots) {
        throw new Error("Weekly slots must be unique")
      }

      if (mode === "lead" && !leadId) {
        throw new Error("Select a lead")
      }

      if (mode === "walk_in" && (!walkInFirstName || !walkInLastName || !walkInEmail || walkInPassword.length < 8)) {
        throw new Error("Walk-in student details are incomplete")
      }

      if (!courseId) {
        throw new Error("Select a course")
      }

      const payload: Record<string, unknown> = {
        coursePlanId,
        courseId,
        startDate,
        weeklySlots: slotRows
          .filter((row) => row.dayOfWeek && row.timeSlotId)
          .map((row) => ({ dayOfWeek: Number(row.dayOfWeek), timeSlotId: row.timeSlotId })),
        extraClasses: Number(extraClasses) || 0,
        discountType,
        discountValue: Number(discountValue) || 0,
        notes: notes || undefined,
      }

      if (mode === "lead") {
        payload.leadId = leadId
      }

      if (mode === "walk_in") {
        payload.walkInStudent = {
          firstName: walkInFirstName,
          lastName: walkInLastName,
          email: walkInEmail,
          phone: walkInPhone || undefined,
          password: walkInPassword,
        }
      }

      const response = await fetch(`${apiUrl}/api/v1/admissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw await parseApiError(response, "Failed to create admission")
      }

      return response.json() as Promise<{ data?: { studentId?: string | null } }>
    },
    onSuccess: async (result) => {
      await onCreated(result.data?.studentId)
      toast.success("Admission created")
      onOpenChange(false)
      setMode("lead")
      setLeadId("")
      setCourseId("")
      setCoursePlanId("")
      setStartDate(getTodayIso())
      setExtraClasses("0")
      setDiscountType("none")
      setDiscountValue("0")
      setNotes("")
      setSlotRows([{ dayOfWeek: "", timeSlotId: "" }])
      setWalkInFirstName("")
      setWalkInLastName("")
      setWalkInEmail("")
      setWalkInPhone("")
      setWalkInPassword("")
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create admission"
      toast.error(message)
    },
  })

  const canSubmit =
    !createMutation.isPending &&
    Boolean(courseId && coursePlanId && startDate) &&
    selectedSlotCount > 0 &&
    !hasDuplicateSlots

  const pricePerClass = selectedPlan && selectedPlan.totalClasses > 0 ? minorToMajor(Math.round(selectedPlan.price / selectedPlan.totalClasses)) : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Create Admission</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          <div className="grid gap-2">
            <Label>Creation mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as CreateMode)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose intake mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">From lead</SelectItem>
                <SelectItem value="walk_in">Walk-in student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "lead" ? (
            <div className="grid gap-2">
              <Label>Lead</Label>
              <Combobox
                value={leadId}
                onValueChange={setLeadId}
                placeholder={prerequisitesQuery.isLoading ? "Loading leads..." : "Select lead"}
                searchPlaceholder="Search leads"
                options={(prerequisitesQuery.data?.data.leads ?? []).map((lead) => ({
                  value: lead.id,
                  label: `${lead.firstName} ${lead.lastName}`,
                }))}
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Walk-in student details</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>First name</Label>
                  <Input value={walkInFirstName} onChange={(event) => setWalkInFirstName(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Last name</Label>
                  <Input value={walkInLastName} onChange={(event) => setWalkInLastName(event.target.value)} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={walkInEmail} onChange={(event) => setWalkInEmail(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <PhoneInput
                    defaultCountry="IN"
                    international
                    value={walkInPhone}
                    onChange={(value) => setWalkInPhone(value ?? "")}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Temporary password</Label>
                <Input
                  type="password"
                  value={walkInPassword}
                  onChange={(event) => setWalkInPassword(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={prerequisitesQuery.isLoading ? "Loading courses..." : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {(prerequisitesQuery.data?.data.courses ?? []).map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.instrumentName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Course plan</Label>
              <Select value={coursePlanId} onValueChange={setCoursePlanId}>
                <SelectTrigger>
                  <SelectValue placeholder={prerequisitesQuery.isLoading ? "Loading plans..." : "Select plan"} />
                </SelectTrigger>
                <SelectContent>
                  {(prerequisitesQuery.data?.data.coursePlans ?? []).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.totalClasses} classes, {formatInrFromMinor(plan.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Extra classes</Label>
              <Input type="number" min={0} value={extraClasses} onChange={(event) => setExtraClasses(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Discount type</Label>
              <Select value={discountType} onValueChange={(value) => setDiscountType(value as "none" | "percent" | "amount") }>
                <SelectTrigger>
                  <SelectValue placeholder="Discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Discount value</Label>
              <Input type="number" min={0} value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Weekly slots</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSlotRows((prev) => [...prev, { dayOfWeek: "", timeSlotId: "" }])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add slot
              </Button>
            </div>

            {slotRows.map((row, index) => {
              const selectedDay = row.dayOfWeek ? Number(row.dayOfWeek) : null
              const dayOptions = selectedDay !== null ? slotOptionsByDay.get(selectedDay) ?? [] : []
              return (
                <div key={`slot-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Select
                    value={row.dayOfWeek}
                    onValueChange={(value) =>
                      setSlotRows((prev) =>
                        prev.map((item, idx) => (idx === index ? { dayOfWeek: value, timeSlotId: "" } : item))
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {openDays.map((day) => (
                        <SelectItem key={day.dayOfWeek} value={String(day.dayOfWeek)}>
                          {dayName(day.dayOfWeek)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={row.timeSlotId}
                    onValueChange={(value) =>
                      setSlotRows((prev) =>
                        prev.map((item, idx) => (idx === index ? { ...item, timeSlotId: value } : item))
                      )
                    }
                    disabled={!row.dayOfWeek}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSlotRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)))
                    }
                    disabled={slotRows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}

            <p className="text-xs text-muted-foreground">
              Selected {selectedSlotCount}
              {selectedPlan ? ` / required ${selectedPlan.classesPerWeek}` : ""}
              {hasDuplicateSlots ? " - remove duplicate slot selections" : ""}
            </p>

            {courseId &&
            openDays.some((day) => {
              const dayOptions = slotOptionsByDay.get(day.dayOfWeek) ?? []
              return dayOptions.length === 0
            }) ? (
              <p className="text-xs text-amber-700">
                Some working days have no classroom allocation for this course. Configure classroom slots before creating admissions.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p>Plan price: {selectedPlan ? formatInrFromMinor(selectedPlan.price) : formatInrFromMinor(0)}</p>
            <p>Price per class: {selectedPlan ? `INR ${pricePerClass.toFixed(2)}` : "INR 0.00"}</p>
            <p>Base classes: {selectedPlan?.totalClasses ?? 0}</p>
            <p>Extra classes: {Number(extraClasses) || 0}</p>
            <p className="font-medium">Final classes: {(selectedPlan?.totalClasses ?? 0) + (Number(extraClasses) || 0)}</p>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSubmit}>
            {createMutation.isPending ? "Creating..." : "Create admission"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
