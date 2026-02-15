import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import BadgeIndicator from "@/components/badge-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import type { LeadStage, LeadStagesResponse } from "@/pages/leads/types";
import { StageFormSheet, type StageFormValues } from "@/pages/settings/stage-form-sheet";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

type WorkingHoursDay = {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
};

type SettingsConfigResponse = {
  data: WorkingHoursDay[];
};

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  return value.slice(0, 5);
}

function StageRowActions({
  title,
  onUpdate,
  onDelete,
}: {
  title: string;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onUpdate}>Update</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stage?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes the stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ConfigPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const role = (session.data?.user as { role?: string } | undefined)?.role;
  const canViewStages = role === "super_admin" || role === "admin" || role === "staff";
  const canManageStages = role === "super_admin" || role === "admin";

  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);
  const [workingHoursDraft, setWorkingHoursDraft] = useState<WorkingHoursDay[]>([]);

  const settingsConfigQuery = useQuery({
    queryKey: ["settings-config"],
    enabled: canViewStages,
    queryFn: async (): Promise<SettingsConfigResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/settings/config`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load settings config");
      }

      return response.json();
    },
  });

  const leadStagesQuery = useQuery({
    queryKey: ["lead-stages"],
    enabled: canViewStages,
    queryFn: async (): Promise<LeadStagesResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/lead-stages`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load lead stages");
      }

      return response.json();
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (values: StageFormValues) => {
      const response = await fetch(`${apiUrl}/api/v1/lead-stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create stage");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lead-stages"] });
      setStageFormOpen(false);
      setEditingStage(null);
      toast.success("Stage created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create stage."));
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: StageFormValues }) => {
      const response = await fetch(`${apiUrl}/api/v1/lead-stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update stage");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lead-stages"] });
      setStageFormOpen(false);
      setEditingStage(null);
      toast.success("Stage updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update stage."));
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/lead-stages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to delete stage");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lead-stages"] });
      toast.success("Stage deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete stage."));
    },
  });

  const saveWorkingHoursMutation = useMutation({
    mutationFn: async () => {
      const payload = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const draft = workingHoursDraft.find((item) => item.dayOfWeek === dayOfWeek);
        if (!draft) {
          return { dayOfWeek, isOpen: false };
        }

        return {
          dayOfWeek,
          isOpen: draft.isOpen,
          startTime: draft.isOpen ? normalizeTimeInput(draft.startTime) : undefined,
          endTime: draft.isOpen ? normalizeTimeInput(draft.endTime) : undefined,
        };
      });

      const response = await fetch(`${apiUrl}/api/v1/settings/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to save working hours");
      }

      return response.json() as Promise<SettingsConfigResponse>;
    },
    onSuccess: async (result) => {
      setWorkingHoursDraft(result.data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["settings-config"] }),
        queryClient.invalidateQueries({ queryKey: ["settings-config", "admissions"] }),
        queryClient.invalidateQueries({ queryKey: ["settings-config", "classroom"] }),
      ]);
      toast.success("Working hours updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to save working hours."));
    },
  });

  useEffect(() => {
    if (leadStagesQuery.isError) {
      toast.error(getErrorMessage(leadStagesQuery.error, "Unable to load lead stages."));
    }
  }, [leadStagesQuery.error, leadStagesQuery.isError]);

  useEffect(() => {
    if (settingsConfigQuery.isError) {
      toast.error(getErrorMessage(settingsConfigQuery.error, "Unable to load working hours."));
    }
  }, [settingsConfigQuery.error, settingsConfigQuery.isError]);

  useEffect(() => {
    if (!settingsConfigQuery.data?.data) {
      return;
    }
    setWorkingHoursDraft(settingsConfigQuery.data.data);
  }, [settingsConfigQuery.data?.data]);

  const isSavingStage = createStageMutation.isPending || updateStageMutation.isPending;
  const orderedStages = useMemo(
    () => [...(leadStagesQuery.data?.data ?? [])].sort((a, b) => a.ordering - b.ordering),
    [leadStagesQuery.data?.data],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Config</h1>
        <p className="mt-1 text-muted-foreground">
          Manage global classroom working hours and stage configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>
            Configure operating days and daily start/end time. Admissions and classroom scheduling use these slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workingHoursDraft.map((day) => (
            <div key={day.dayOfWeek} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{DAY_LABELS[day.dayOfWeek] ?? `Day ${day.dayOfWeek}`}</p>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`working-day-${day.dayOfWeek}`} className="text-xs text-muted-foreground">
                    Open
                  </Label>
                  <Switch
                    id={`working-day-${day.dayOfWeek}`}
                    checked={day.isOpen}
                    onCheckedChange={(checked) =>
                      setWorkingHoursDraft((prev) =>
                        prev.map((item) =>
                          item.dayOfWeek === day.dayOfWeek
                            ? {
                                ...item,
                                isOpen: checked,
                                startTime: checked ? item.startTime ?? "15:00" : null,
                                endTime: checked ? item.endTime ?? "21:00" : null,
                              }
                            : item
                        )
                      )
                    }
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Start time</Label>
                  <Input
                    type="time"
                    disabled={!day.isOpen}
                    value={normalizeTimeInput(day.startTime)}
                    onChange={(event) =>
                      setWorkingHoursDraft((prev) =>
                        prev.map((item) =>
                          item.dayOfWeek === day.dayOfWeek
                            ? { ...item, startTime: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">End time</Label>
                  <Input
                    type="time"
                    disabled={!day.isOpen}
                    value={normalizeTimeInput(day.endTime)}
                    onChange={(event) =>
                      setWorkingHoursDraft((prev) =>
                        prev.map((item) =>
                          item.dayOfWeek === day.dayOfWeek
                            ? { ...item, endTime: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              onClick={() => saveWorkingHoursMutation.mutate()}
              disabled={saveWorkingHoursMutation.isPending || !canManageStages}
            >
              {saveWorkingHoursMutation.isPending ? "Saving..." : "Save working hours"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stages</CardTitle>
          <CardDescription>
            Create and update lead stages with a color indicator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canViewStages ? (
            <>
              {canManageStages ? (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setEditingStage(null);
                      setStageFormOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Stage
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                {orderedStages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <BadgeIndicator color={stage.color} title={stage.name} />
                      <span className="text-xs text-muted-foreground">Order {stage.ordering}</span>
                    </div>
                    {canManageStages ? (
                      <StageRowActions
                        title={stage.name}
                        onUpdate={() => {
                          setEditingStage(stage);
                          setStageFormOpen(true);
                        }}
                        onDelete={() => {
                          deleteStageMutation.mutate(stage.id);
                        }}
                      />
                    ) : null}
                  </div>
                ))}

                {!orderedStages.length ? (
                  <div className="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
                    {leadStagesQuery.isLoading ? "Loading stages..." : "No stages configured."}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stage config is available to staff, admins, and super admins.
            </p>
          )}
        </CardContent>
      </Card>

      <StageFormSheet
        open={stageFormOpen}
        onOpenChange={(open) => {
          setStageFormOpen(open);
          if (!open) {
            setEditingStage(null);
          }
        }}
        stage={editingStage}
        isSaving={isSavingStage}
        onSubmit={async (values) => {
          if (editingStage) {
            await updateStageMutation.mutateAsync({ id: editingStage.id, values });
            return;
          }

          await createStageMutation.mutateAsync(values);
        }}
      />
    </div>
  );
}
