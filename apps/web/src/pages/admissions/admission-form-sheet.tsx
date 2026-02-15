import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import PreferredSlotSelect, {
  type PreferredSlotSelection,
} from "@/components/preferred-slots-selection";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatInrFromMinor, minorToMajor } from "@/lib/money";
import type { Course, CoursePlan, Lead } from "@/pages/admissions/types";

type CreateMode = "lead" | "walk_in";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (studentId?: string | null) => Promise<void> | void;
  initialLeadId?: string | null;
};

type ApiErrorBody = {
  error?: string;
  details?: {
    capacityIssues?: Array<{ classroomSlotId: string; timeSlotId: string }>;
  };
};

type TimeSlotsResponse = {
  data: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isActive: boolean;
  }>;
};

type SettingsConfigResponse = {
  data: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    startTime: string | null;
    endTime: string | null;
    slots: Array<{ id: string; startTime: string; endTime: string }>;
  }>;
};

type LeadsResponse = {
  data: Lead[];
  total: number;
};

type CoursesResponse = {
  data: Course[];
  total: number;
};

type CoursePlansResponse = {
  data: CoursePlan[];
};

type ClassroomSlotsResponse = {
  data: Array<{
    id: string;
    timeSlotId: string;
    isActive: boolean;
    capacity: number;
    occupancy: number;
    timeSlot: {
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    };
  }>;
};

function getTodayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

function dayName(day: number) {
  return (
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][day] ?? `Day ${day}`
  );
}

function formatTimeLabel(startTime: string) {
  const [hourPart, minutePart] = startTime.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return startTime;
  }

  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteText = minute.toString().padStart(2, "0");
  return `${hour12}:${minuteText} ${meridiem}`;
}

async function parseApiError(response: Response, fallback: string) {
  let body: ApiErrorBody | undefined;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    return new Error(fallback);
  }

  const message = body?.error || fallback;
  if (body?.details?.capacityIssues?.length) {
    return new Error(`${message}. One or more selected slots are full.`);
  }
  return new Error(message);
}

export function AdmissionFormSheet({
  open,
  onOpenChange,
  onCreated,
  initialLeadId,
}: Props) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const [mode, setMode] = useState<CreateMode>("lead");
  const [leadId, setLeadId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [coursePlanId, setCoursePlanId] = useState("");
  const [startDate, setStartDate] = useState(getTodayIso());
  const [extraClasses, setExtraClasses] = useState("0");
  const [discountType, setDiscountType] = useState<
    "none" | "percent" | "amount"
  >("none");
  const [discountValue, setDiscountValue] = useState("0");
  const [notes, setNotes] = useState("");
  const [preferredSlots, setPreferredSlots] = useState<PreferredSlotSelection>(
    {},
  );

  const [walkInFirstName, setWalkInFirstName] = useState("");
  const [walkInLastName, setWalkInLastName] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInPassword, setWalkInPassword] = useState("");

  const leadsQuery = useQuery({
    queryKey: ["admissions", "leads"],
    enabled: open,
    queryFn: async (): Promise<LeadsResponse> => {
      const params = new URLSearchParams();
      params.set("excludeOnboarded", "true");
      params.set("page", "1");
      params.set("pageSize", "10");

      const response = await fetch(`${apiUrl}/api/v1/leads?${params}`, {
        credentials: "include",
      });
      if (!response.ok)
        throw await parseApiError(response, "Failed to load leads");
      return response.json();
    },
  });

  const coursesQuery = useQuery({
    queryKey: ["admissions", "courses"],
    enabled: open,
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "10",
        isActive: "true",
      });
      const response = await fetch(`${apiUrl}/api/v1/courses?${params}`, {
        credentials: "include",
      });
      if (!response.ok)
        throw await parseApiError(response, "Failed to load courses");
      return response.json();
    },
  });

  const coursePlansQuery = useQuery({
    queryKey: ["admissions", "course-plans"],
    enabled: open,
    queryFn: async (): Promise<CoursePlansResponse> => {
      const response = await fetch(
        `${apiUrl}/api/v1/course-plans?isActive=true`,
        {
          credentials: "include",
        },
      );
      if (!response.ok)
        throw await parseApiError(response, "Failed to load course plans");
      return response.json();
    },
  });

  const settingsConfigQuery = useQuery({
    queryKey: ["settings-config", "admissions"],
    enabled: open,
    queryFn: async (): Promise<SettingsConfigResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/settings/config`, {
        credentials: "include",
      });
      if (!response.ok)
        throw await parseApiError(response, "Failed to load settings config");
      return response.json();
    },
  });

  const classroomSlotsQuery = useQuery({
    queryKey: ["admissions", "classroom-slots", courseId],
    enabled: open && Boolean(courseId),
    queryFn: async (): Promise<ClassroomSlotsResponse> => {
      const params = new URLSearchParams({ courseId });
      const response = await fetch(
        `${apiUrl}/api/v1/classroom-slots?${params}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok)
        throw await parseApiError(response, "Failed to load classroom slots");
      return response.json();
    },
  });

  const selectedPlan = (coursePlansQuery.data?.data ?? []).find(
    (plan) => plan.id === coursePlanId,
  );
  const openDays = (settingsConfigQuery.data?.data ?? []).filter(
    (day) => day.isOpen,
  );

  const availableDays = useMemo(
    () =>
      openDays.map((day) => ({
        id: day.dayOfWeek,
        label: dayName(day.dayOfWeek).slice(0, 3),
      })),
    [openDays],
  );

  const slotOptionsByDay = useMemo(() => {
    const byDay: Record<
      number,
      Array<{ id: string; label: string; disabled: boolean; hint?: string }>
    > = {};
    const openDaySet = new Set(openDays.map((day) => day.dayOfWeek));

    const classroomSlotByTemplate = new Map(
      (classroomSlotsQuery.data?.data ?? [])
        .filter((slot) => slot.isActive && slot.timeSlot?.isActive)
        .map((slot) => [slot.timeSlotId, slot] as const),
    );

    const configSlots: TimeSlotsResponse["data"] = [];
    for (const day of settingsConfigQuery.data?.data ?? []) {
      if (!day.isOpen || !openDaySet.has(day.dayOfWeek)) {
        continue;
      }

      for (const slot of day.slots) {
        configSlots.push({
          id: slot.id,
          dayOfWeek: day.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: 60,
          isActive: true,
        });
      }
    }

    for (const timeSlot of configSlots) {
      if (!timeSlot.isActive || !openDaySet.has(timeSlot.dayOfWeek)) {
        continue;
      }

      const classSlot = classroomSlotByTemplate.get(timeSlot.id);
      const isFull = classSlot
        ? classSlot.occupancy >= classSlot.capacity
        : false;
      const hasCourse = Boolean(courseId);
      const isUnavailable = !hasCourse || !classSlot || isFull;

      let hint: string | undefined;
      if (!hasCourse) {
        hint = "Select course";
      } else if (!classSlot) {
        hint = "No classroom";
      } else if (isFull) {
        hint = "Full";
      } else {
        hint = `${classSlot.occupancy}/${classSlot.capacity}`;
      }

      const existing = byDay[timeSlot.dayOfWeek] ?? [];
      existing.push({
        id: timeSlot.id,
        label: formatTimeLabel(timeSlot.startTime),
        disabled: isUnavailable,
        hint,
      });
      byDay[timeSlot.dayOfWeek] = existing;
    }

    return byDay;
  }, [
    classroomSlotsQuery.data?.data,
    courseId,
    openDays,
    settingsConfigQuery.data?.data,
  ]);

  useEffect(() => {
    setPreferredSlots((current) => {
      const next: PreferredSlotSelection = {};

      for (const [day, slotIds] of Object.entries(current)) {
        const dayNumber = Number(day);
        const allowed = new Set(
          (slotOptionsByDay[dayNumber] ?? [])
            .filter((slot) => !slot.disabled)
            .map((slot) => slot.id),
        );

        const filtered = slotIds.filter((slotId) => allowed.has(slotId));
        if (filtered.length) {
          next[dayNumber] = filtered;
        }
      }

      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [slotOptionsByDay]);

  useEffect(() => {
    if (open && initialLeadId) {
      setMode("lead");
      setLeadId(initialLeadId);
    }
  }, [open, initialLeadId]);

  const selectedWeeklySlots = useMemo(
    () =>
      Object.entries(preferredSlots).flatMap(([day, slotIds]) =>
        slotIds.map((timeSlotId) => ({ dayOfWeek: Number(day), timeSlotId })),
      ),
    [preferredSlots],
  );

  const selectedSlotCount = selectedWeeklySlots.length;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) {
        throw new Error("Select a course plan");
      }

      if (selectedSlotCount !== selectedPlan.classesPerWeek) {
        throw new Error(
          `Select exactly ${selectedPlan.classesPerWeek} weekly slots`,
        );
      }

      if (mode === "lead" && !leadId) {
        throw new Error("Select a lead");
      }

      if (
        mode === "walk_in" &&
        (!walkInFirstName ||
          !walkInLastName ||
          !walkInEmail ||
          walkInPassword.length < 8)
      ) {
        throw new Error("Walk-in student details are incomplete");
      }

      if (!courseId) {
        throw new Error("Select a course");
      }

      const payload: Record<string, unknown> = {
        coursePlanId,
        courseId,
        startDate,
        weeklySlots: selectedWeeklySlots,
        extraClasses: Number(extraClasses) || 0,
        discountType,
        discountValue: Number(discountValue) || 0,
        notes: notes || undefined,
      };

      if (mode === "lead") {
        payload.leadId = leadId;
      }

      if (mode === "walk_in") {
        payload.walkInStudent = {
          firstName: walkInFirstName,
          lastName: walkInLastName,
          email: walkInEmail,
          phone: walkInPhone || undefined,
          password: walkInPassword,
        };
      }

      const response = await fetch(`${apiUrl}/api/v1/admissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await parseApiError(response, "Failed to create admission");
      }

      return response.json() as Promise<{
        data?: { studentId?: string | null };
      }>;
    },
    onSuccess: async (result) => {
      await onCreated(result.data?.studentId);
      toast.success("Admission created");
      onOpenChange(false);
      setMode("lead");
      setLeadId("");
      setCourseId("");
      setCoursePlanId("");
      setStartDate(getTodayIso());
      setExtraClasses("0");
      setDiscountType("none");
      setDiscountValue("0");
      setNotes("");
      setPreferredSlots({});
      setWalkInFirstName("");
      setWalkInLastName("");
      setWalkInEmail("");
      setWalkInPhone("");
      setWalkInPassword("");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create admission";
      toast.error(message);
    },
  });

  const canSubmit =
    !createMutation.isPending &&
    Boolean(courseId && coursePlanId && startDate) &&
    selectedSlotCount > 0;

  const pricePerClass =
    selectedPlan && selectedPlan.totalClasses > 0
      ? minorToMajor(Math.round(selectedPlan.price / selectedPlan.totalClasses))
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Create Admission</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          <div className="grid gap-2">
            <Label>Creation mode</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as CreateMode)}
            >
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
                placeholder={
                  leadsQuery.isLoading ? "Loading leads..." : "Select lead"
                }
                searchPlaceholder="Search leads"
                options={(leadsQuery.data?.data ?? []).map((lead) => ({
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
                  <Input
                    value={walkInFirstName}
                    onChange={(event) => setWalkInFirstName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Last name</Label>
                  <Input
                    value={walkInLastName}
                    onChange={(event) => setWalkInLastName(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={walkInEmail}
                    onChange={(event) => setWalkInEmail(event.target.value)}
                  />
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
                  <SelectValue
                    placeholder={
                      coursesQuery.isLoading
                        ? "Loading courses..."
                        : "Select course"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(coursesQuery.data?.data ?? []).map((course) => (
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
                  <SelectValue
                    placeholder={
                      coursePlansQuery.isLoading
                        ? "Loading plans..."
                        : "Select plan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(coursePlansQuery.data?.data ?? []).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.totalClasses} classes,{" "}
                      {formatInrFromMinor(plan.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Extra classes</Label>
              <Input
                type="number"
                min={0}
                value={extraClasses}
                onChange={(event) => setExtraClasses(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Discount type</Label>
              <Select
                value={discountType}
                onValueChange={(value) =>
                  setDiscountType(value as "none" | "percent" | "amount")
                }
              >
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
              <Input
                type="number"
                min={0}
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Weekly slots</p>
              <p className="text-xs text-muted-foreground">
                Full slots are disabled
              </p>
            </div>

            <PreferredSlotSelect
              days={availableDays}
              slotsByDay={slotOptionsByDay}
              selectedSlots={preferredSlots}
              setSlotsAction={setPreferredSlots}
            />

            <p className="text-xs text-muted-foreground">
              Selected {selectedSlotCount}
              {selectedPlan ? ` / required ${selectedPlan.classesPerWeek}` : ""}
            </p>

            {courseId &&
            openDays.some((day) => {
              const dayOptions = slotOptionsByDay[day.dayOfWeek] ?? [];
              return dayOptions.length === 0;
            }) ? (
              <p className="text-xs text-amber-700">
                Some working days have no classroom allocation for this course.
                Configure classroom slots before creating admissions.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              Plan price:{" "}
              {selectedPlan
                ? formatInrFromMinor(selectedPlan.price)
                : formatInrFromMinor(0)}
            </p>
            <p>
              Price per class:{" "}
              {selectedPlan ? `INR ${pricePerClass.toFixed(2)}` : "INR 0.00"}
            </p>
            <p>Base classes: {selectedPlan?.totalClasses ?? 0}</p>
            <p>Extra classes: {Number(extraClasses) || 0}</p>
            <p className="font-medium">
              Final classes:{" "}
              {(selectedPlan?.totalClasses ?? 0) + (Number(extraClasses) || 0)}
            </p>
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
  );
}
