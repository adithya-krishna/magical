import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import debounce from "lodash/debounce";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/data-tables/data-table";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  usePaginationConfig,
} from "@/lib/pagination-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { AdmissionFormSheet } from "@/pages/admissions/admission-form-sheet";
import { AdmissionRowActions } from "@/pages/admissions/admission-row-actions";
import type {
  Admission,
  AdmissionStatus,
  AdmissionsResponse,
  CoursePlansResponse,
} from "@/pages/admissions/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AppRole = "super_admin" | "admin" | "staff" | "teacher" | "student";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function roleCanViewAdmissions(role: AppRole) {
  return role === "super_admin" || role === "admin" || role === "staff";
}

export function AdmissionsPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const paginationConfigQuery = usePaginationConfig();
  const pageSizeOptions = paginationConfigQuery.data?.data.pageSizeOptions ?? [
    ...DEFAULT_PAGE_SIZE_OPTIONS,
  ];
  const defaultPageSize =
    paginationConfigQuery.data?.data.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const role =
    (session.data?.user as { role?: AppRole } | undefined)?.role ?? "student";
  const canViewAdmissions = roleCanViewAdmissions(role);
  const canCreateAdmissions = canViewAdmissions;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialLeadId, setInitialLeadId] = useState<string | null>(null);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(
    null,
  );
  const [editStatus, setEditStatus] = useState<AdmissionStatus>("pending");

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get("leadId");
    if (leadId) {
      setInitialLeadId(leadId);
      setCreateOpen(true);
    }
  }, []);

  const admissionsQuery = useQuery({
    queryKey: ["admissions", search, page, pageSize],
    enabled: canViewAdmissions,
    queryFn: async (): Promise<AdmissionsResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${apiUrl}/api/v1/admissions?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load admissions");
      }

      return response.json();
    },
  });

  const coursePlansQuery = useQuery({
    queryKey: ["course-plans", "all"],
    enabled: canViewAdmissions,
    queryFn: async (): Promise<CoursePlansResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/course-plans`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load course plans");
      }

      return response.json();
    },
  });

  useEffect(() => {
    if (admissionsQuery.isError) {
      toast.error(
        getErrorMessage(admissionsQuery.error, "Unable to load admissions."),
      );
    }
  }, [admissionsQuery.isError, admissionsQuery.error]);

  useEffect(() => {
    if (coursePlansQuery.isError) {
      toast.error(
        getErrorMessage(coursePlansQuery.error, "Unable to load course plans."),
      );
    }
  }, [coursePlansQuery.isError, coursePlansQuery.error]);

  const updateAdmissionMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AdmissionStatus;
    }) => {
      const response = await fetch(`${apiUrl}/api/v1/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update admission");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission updated");
      setEditingAdmission(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update admission."));
    },
  });

  const deleteAdmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/admissions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete admission");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete admission."));
    },
  });

  if (!canViewAdmissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admissions</CardTitle>
          <CardDescription>
            You do not have permission to view admissions. This page is
            available to super admins, admins, and staff.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const columns: ColumnDef<{
    admission: Admission;
    lead: Admission["lead"];
  }>[] = [
    {
      id: "lead_name",
      accessorFn: (row) =>
        `${row.lead?.firstName ?? ""} ${row.lead?.lastName ?? ""}`.trim(),
      header: "Lead",
      cell: ({ row }) => {
        if (!row.original.lead) {
          return (
            <span className="font-mono text-xs">
              {row.original.admission.leadId}
            </span>
          );
        }

        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium">
              {row.original.lead.firstName} {row.original.lead.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.lead.phone}
              {row.original.lead.email ? ` • ${row.original.lead.email}` : ""}
            </div>
          </div>
        );
      },
    },
    {
      id: "lead_phone",
      accessorFn: (row) => row.lead?.phone ?? "",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.lead?.phone ?? "-"}
        </span>
      ),
    },
    {
      id: "lead_email",
      accessorFn: (row) => row.lead?.email ?? "",
      header: "Email",
      cell: ({ row }) => row.original.lead?.email ?? "-",
    },
    {
      id: "course_plan",
      accessorFn: (row) =>
        (coursePlansQuery.data?.data ?? []).find(
          (plan) => plan.id === row.admission.coursePlanId,
        )?.name ?? row.admission.coursePlanId,
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues)
          ? (filterValues as string[])
          : [];
        if (!selected.length) {
          return true;
        }
        return selected.includes(String(row.getValue(columnId)));
      },
      header: "Plan",
      cell: ({ row }) => {
        const planName = (coursePlansQuery.data?.data ?? []).find(
          (plan) => plan.id === row.original.admission.coursePlanId,
        )?.name;
        return planName ?? row.original.admission.coursePlanId;
      },
    },
    {
      header: "Total Classes",
      cell: ({ row }) => {
        return (
          <span className="text-muted-foreground">
            {row.original.admission.finalClasses}
          </span>
        );
      },
    },
    {
      header: "Start from",
      cell: ({ row }) => formatDate(row.original.admission.startDate),
    },
    {
      id: "status",
      accessorFn: (row) => row.admission.status,
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues)
          ? (filterValues as string[])
          : [];
        if (!selected.length) {
          return true;
        }
        return selected.includes(String(row.getValue(columnId)));
      },
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.admission.status === "active" ? "secondary" : "outline"
          }
        >
          {row.original.admission.status}
        </Badge>
      ),
    },
    {
      id: "created_at",
      accessorFn: (row) => row.admission.createdAt,
      header: "Created",
      cell: ({ row }) => formatDate(row.original.admission.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original.admission;
        const leadName = row.original.lead
          ? `${row.original.lead.firstName} ${row.original.lead.lastName}`
          : item.leadId;

        return (
          <AdmissionRowActions
            title={leadName}
            onUpdate={() => {
              setEditingAdmission(item);
              setEditStatus(item.status);
            }}
            onDelete={() => {
              deleteAdmissionMutation.mutate(item.id);
            }}
          />
        );
      },
    },
  ];

  const total = admissionsQuery.data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Admissions list</CardTitle>
            {canCreateAdmissions && (
              <div className="flex items-center ">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create Admission</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
          <CardDescription>
            Search contacts and filter by status or course details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={admissionsQuery.data?.data ?? []}
            searchableColumnIds={["lead_name", "lead_phone", "lead_email"]}
            searchPlaceholder="Search by lead name, phone, or email"
            filters={[
              {
                title: "Status",
                columnId: "status",
                options: [
                  { label: "Pending", value: "pending" },
                  { label: "Active", value: "active" },
                  { label: "Completed", value: "completed" },
                  { label: "Cancelled", value: "cancelled" },
                ],
              },
              {
                title: "Course Plan",
                columnId: "course_plan",
                options: (coursePlansQuery.data?.data ?? []).map((plan) => ({
                  label: plan.name,
                  value: plan.name,
                })),
              },
            ]}
            initialColumnVisibility={{
              lead_phone: false,
              lead_email: false,
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
            isLoading={admissionsQuery.isLoading}
            loadingMessage="Loading admissions..."
            emptyMessage="No admissions found."
            searchValue={searchInput}
            onSearchChange={(value) => {
              setSearchInput(value);
              debouncedSearchUpdate(value.trim());
            }}
          />

          <div className="text-sm text-muted-foreground">
            Total {total} admissions
          </div>
        </CardContent>
      </Card>

      <AdmissionFormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
        }}
        initialLeadId={initialLeadId}
        onCreated={async (studentId) => {
          await queryClient.invalidateQueries({ queryKey: ["admissions"] });
          if (studentId) {
            toast.success("Student account created as part of admission");
          }
        }}
      />

      <Dialog
        open={Boolean(editingAdmission)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAdmission(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update admission status</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Select
              value={editStatus}
              onValueChange={(value) => setEditStatus(value as AdmissionStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAdmission(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingAdmission) {
                  return;
                }
                updateAdmissionMutation.mutate({
                  id: editingAdmission.id,
                  status: editStatus,
                });
              }}
              disabled={updateAdmissionMutation.isPending || !editingAdmission}
            >
              {updateAdmissionMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
