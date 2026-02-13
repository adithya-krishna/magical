import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "@tanstack/react-router";
import debounce from "lodash/debounce";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-tables/data-table";
import BadgeIndicator from "@/components/badge-indicator";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  usePaginationConfig,
} from "@/lib/pagination-config";
import {
  LeadFormSheet,
  mapLeadFormToPayload,
} from "@/pages/leads/lead-form-sheet";
import { LeadRowActions } from "@/pages/leads/lead-row-actions";
import type {
  Lead,
  LeadFormValues,
  LeadsResponse,
  LeadStagesResponse,
} from "@/pages/leads/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    if (
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
  }

  return fallback;
}

export function LeadsPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const paginationConfigQuery = usePaginationConfig();
  const pageSizeOptions =
    paginationConfigQuery.data?.data.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS];
  const defaultPageSize =
    paginationConfigQuery.data?.data.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const debouncedSearchUpdate = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSearchUpdate.cancel();
    };
  }, [debouncedSearchUpdate]);

  useEffect(() => {
    setPageSize((current) =>
      current === DEFAULT_PAGE_SIZE ? defaultPageSize : current,
    );
  }, [defaultPageSize]);

  const leadsQuery = useQuery({
    queryKey: ["leads", search, page, pageSize],
    queryFn: async (): Promise<LeadsResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${apiUrl}/api/v1/leads?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load leads");
      }

      return response.json();
    },
    placeholderData: (previous) => previous,
  });

  const stagesQuery = useQuery({
    queryKey: ["lead-stages"],
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

  const createLeadMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const response = await fetch(`${apiUrl}/api/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mapLeadFormToPayload(values)),
      });

      if (!response.ok) {
        throw new Error("Failed to create lead");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setFormOpen(false);
      setEditingLead(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create lead."));
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: LeadFormValues;
    }) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mapLeadFormToPayload(values)),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setFormOpen(false);
      setEditingLead(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update lead."));
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete lead."));
    },
  });

  useEffect(() => {
    if (leadsQuery.isError) {
      toast.error(getErrorMessage(leadsQuery.error, "Unable to load leads."));
    }
  }, [leadsQuery.isError, leadsQuery.error]);

  useEffect(() => {
    if (stagesQuery.isError) {
      toast.error(
        getErrorMessage(stagesQuery.error, "Unable to load lead stages."),
      );
    }
  }, [stagesQuery.isError, stagesQuery.error]);

  const stageById = useMemo(() => {
    const map = new Map<string, LeadStagesResponse["data"][number]>();
    for (const stage of stagesQuery.data?.data ?? []) {
      map.set(stage.id, stage);
    }
    return map;
  }, [stagesQuery.data?.data]);

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
        header: "Lead",
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {lead.firstName} {lead.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {lead.email || "-"}
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        accessorFn: (row) => row.email ?? "",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        header: "Phone",
        accessorKey: "phone",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.phone || "-"}</span>
        ),
      },
      {
        id: "stage",
        accessorFn: (row) => stageById.get(row.stageId)?.name ?? "",
        filterFn: (row, columnId, filterValues) => {
          const selected = Array.isArray(filterValues)
            ? (filterValues as string[])
            : [];
          if (!selected.length) {
            return true;
          }
          return selected.includes(String(row.getValue(columnId)));
        },
        header: "Stage",
        cell: ({ row }) => {
          const stage = stageById.get(row.original.stageId);

          if (!stage?.name) {
            return "-";
          }

          return <BadgeIndicator color={stage.color} title={stage.name} />;
        },
      },
      {
        header: "Follow-up",
        cell: ({ row }) => formatDate(row.original.followUpDate),
      },
      {
        id: "follow_up_status",
        header: "Status",
        accessorKey: "followUpStatus",
        filterFn: (row, columnId, filterValues) => {
          const selected = Array.isArray(filterValues)
            ? (filterValues as string[])
            : [];
          if (!selected.length) {
            return true;
          }
          return selected.includes(String(row.getValue(columnId)));
        },
        cell: ({ getValue }) => {
          const value = getValue<Lead["followUpStatus"]>();
          return value === "done" ? "Done" : "Open";
        },
      },
      {
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const lead = row.original;

          return (
            <LeadRowActions
              leadId={lead.id}
              leadName={`${lead.firstName} ${lead.lastName}`}
              onUpdate={() => {
                setEditingLead(lead);
                setFormOpen(true);
              }}
              onDelete={() => {
                deleteLeadMutation.mutate(lead.id);
              }}
            />
          );
        },
      },
    ],
    [deleteLeadMutation, stageById],
  );

  const total = leadsQuery.data?.total ?? 0;

  const isSaving = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-2xl">Leads</CardTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      onClick={() => {
                        setEditingLead(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create lead</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={"ghost"} size={"icon"}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bulk upload</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <CardDescription>
              Review lead status, follow-up timelines, and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable
              columns={columns}
              data={leadsQuery.data?.data ?? []}
              searchableColumnIds={["name", "phone", "email"]}
              searchPlaceholder="Search by name, phone, or email"
              filters={[
                {
                  title: "Stage",
                  columnId: "stage",
                  options: (stagesQuery.data?.data ?? []).map((stage) => ({
                    label: stage.name,
                    value: stage.name,
                  })),
                },
                {
                  title: "Status",
                  columnId: "follow_up_status",
                  options: [
                    { label: "Open", value: "open" },
                    { label: "Done", value: "done" },
                  ],
                },
              ]}
              isLoading={leadsQuery.isLoading}
              loadingMessage="Loading leads..."
              emptyMessage="No leads found."
              searchValue={searchInput}
              onSearchChange={(value) => {
                setSearchInput(value);
                debouncedSearchUpdate(value.trim());
              }}
              pagination={{
                page,
                pageSize,
                total,
                onPageChange: setPage,
                onPageSizeChange: (nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                },
              }}
              pageSizeOptions={pageSizeOptions}
              onRowClick={(lead) => {
                navigate({
                  to: "/leads/$id/$tab",
                  params: { id: lead.id, tab: "follow-up" },
                });
              }}
            />

            <div className="text-sm text-muted-foreground">
              {leadsQuery.isError
                ? "Unable to load leads."
                : `Showing ${leadsQuery.data?.data.length ?? 0} of ${total} leads`}
              {leadsQuery.isFetching && !leadsQuery.isLoading ? " • Updating" : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <LeadFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editingLead}
        stages={stagesQuery.data?.data ?? []}
        isSaving={isSaving}
        onSubmit={async (values) => {
          if (editingLead) {
            await updateLeadMutation.mutateAsync({
              id: editingLead.id,
              values,
            });
            return;
          }

          await createLeadMutation.mutateAsync(values);
        }}
      />
    </>
  );
}
