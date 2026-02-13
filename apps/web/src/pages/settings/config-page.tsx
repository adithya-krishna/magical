import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import BadgeIndicator from "@/components/badge-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ConfigPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const role = (session.data?.user as { role?: string } | undefined)?.role;
  const canViewStages = role === "super_admin" || role === "admin" || role === "staff";
  const canManageStages = role === "super_admin" || role === "admin";

  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);

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

  useEffect(() => {
    if (leadStagesQuery.isError) {
      toast.error(getErrorMessage(leadStagesQuery.error, "Unable to load lead stages."));
    }
  }, [leadStagesQuery.error, leadStagesQuery.isError]);

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
          Manage stage configuration used across the lead pipeline.
        </p>
      </div>

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
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingStage(stage);
                          setStageFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
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
