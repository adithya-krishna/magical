import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable,
} from "@tanstack/react-table";
import debounce from "lodash/debounce";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadDetailsSheet } from "@/pages/leads/lead-details-sheet";
import {
  LeadFormSheet,
  mapLeadFormToPayload,
} from "@/pages/leads/lead-form-sheet";
import { LeadRowActions } from "@/pages/leads/lead-row-actions";
import type {
  Lead,
  LeadDetailsResponse,
  LeadFormValues,
  LeadsResponse,
  LeadStagesResponse,
} from "@/pages/leads/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PAGE_SIZE = 25;

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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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

  const leadsQuery = useQuery({
    queryKey: ["leads", search, page],
    queryFn: async (): Promise<LeadsResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
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

  const leadDetailsQuery = useQuery({
    queryKey: ["lead", selectedLeadId],
    enabled: detailsOpen && Boolean(selectedLeadId),
    queryFn: async (): Promise<LeadDetailsResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${selectedLeadId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load lead details");
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
      if (selectedLeadId) {
        await queryClient.invalidateQueries({
          queryKey: ["lead", selectedLeadId],
        });
      }
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
      if (selectedLeadId) {
        setDetailsOpen(false);
        setSelectedLeadId(null);
      }
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

  useEffect(() => {
    if (leadDetailsQuery.isError) {
      toast.error(
        getErrorMessage(leadDetailsQuery.error, "Unable to load lead details."),
      );
    }
  }, [leadDetailsQuery.isError, leadDetailsQuery.error]);

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const stage of stagesQuery.data?.data ?? []) {
      map.set(stage.id, stage.name);
    }
    return map;
  }, [stagesQuery.data?.data]);

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
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
        header: "Phone",
        accessorKey: "phone",
        cell: ({ row }) => {
          return <div className="font-mono text-xs">{row.original.phone}</div>;
        },
      },
      {
        id: "stage",
        header: "Stage",
        cell: ({ row }) => {
          const stage = stageNameById.get(row.original.stageId);

          if (!stage) {
            return "-";
          }

          return (
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs"
            >
              {stage}
            </Badge>
          );
        },
      },
      {
        header: "Follow-up",
        cell: ({ row }) => formatDate(row.original.followUpDate),
      },
      {
        header: "Status",
        accessorKey: "followUpStatus",
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
    [deleteLeadMutation, stageNameById],
  );

  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const table = useReactTable({
    data: leadsQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isSaving = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="mt-1 text-muted-foreground">
              Search by name, phone, or email to find incoming leads.
            </p>
          </div>

          <div className="flex w-full max-w-xl items-center justify-end gap-2">
            <Input
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;
                setSearchInput(value);
                debouncedSearchUpdate(value.trim());
              }}
              placeholder="Search by name, phone, or email"
              aria-label="Search leads"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={"icon"}
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
                <Button size={"icon"}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bulk upload</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leads directory</CardTitle>
            <CardDescription>
              Review lead status, follow-up timelines, and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {leadsQuery.isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Loading leads...
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedLeadId(row.original.id);
                          setDetailsOpen(true);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No leads found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-muted-foreground">
                {leadsQuery.isError
                  ? "Unable to load leads."
                  : `Showing ${table.getRowModel().rows.length} of ${total} leads`}
                {leadsQuery.isFetching && !leadsQuery.isLoading
                  ? " • Updating"
                  : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || leadsQuery.isLoading}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage >= totalPages || leadsQuery.isLoading}
                >
                  Next
                </Button>
              </div>
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

      <LeadDetailsSheet
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
        lead={leadDetailsQuery.data?.data}
        isLoading={leadDetailsQuery.isLoading}
      />
    </>
  );
}
