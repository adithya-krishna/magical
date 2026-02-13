import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table"
import debounce from "lodash/debounce"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { AdmissionFormSheet } from "@/pages/admissions/admission-form-sheet"
import type { Admission, AdmissionsResponse, CoursePlansResponse } from "@/pages/admissions/types"

type AppRole = "super_admin" | "admin" | "staff" | "teacher" | "student"

const PAGE_SIZE = 25

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }

  return fallback
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString()
}

function roleCanViewAdmissions(role: AppRole) {
  return role === "super_admin" || role === "admin" || role === "staff"
}

export function AdmissionsPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const session = authClient.useSession()
  const queryClient = useQueryClient()
  const role = ((session.data?.user as { role?: AppRole } | undefined)?.role ?? "student")
  const canViewAdmissions = roleCanViewAdmissions(role)
  const canCreateAdmissions = canViewAdmissions
  const [status, setStatus] = useState<string>("all")
  const [coursePlanId, setCoursePlanId] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [initialLeadId, setInitialLeadId] = useState<string | null>(null)

  const debouncedSearchUpdate = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value)
        setPage(1)
      }, 300),
    []
  )

  useEffect(() => {
    return () => {
      debouncedSearchUpdate.cancel()
    }
  }, [debouncedSearchUpdate])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const leadId = params.get("leadId")
    if (leadId) {
      setInitialLeadId(leadId)
      setCreateOpen(true)
    }
  }, [])

  const admissionsQuery = useQuery({
    queryKey: ["admissions", status, coursePlanId, search, page],
    enabled: canViewAdmissions,
    queryFn: async (): Promise<AdmissionsResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })

      if (status !== "all") {
        params.set("status", status)
      }

      if (coursePlanId !== "all") {
        params.set("coursePlanId", coursePlanId)
      }

      if (search.trim()) {
        params.set("search", search.trim())
      }

      const response = await fetch(`${apiUrl}/api/v1/admissions?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load admissions")
      }

      return response.json()
    },
  })

  const coursePlansQuery = useQuery({
    queryKey: ["course-plans", "all"],
    enabled: canViewAdmissions,
    queryFn: async (): Promise<CoursePlansResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/course-plans`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load course plans")
      }

      return response.json()
    },
  })

  useEffect(() => {
    if (admissionsQuery.isError) {
      toast.error(getErrorMessage(admissionsQuery.error, "Unable to load admissions."))
    }
  }, [admissionsQuery.isError, admissionsQuery.error])

  useEffect(() => {
    if (coursePlansQuery.isError) {
      toast.error(getErrorMessage(coursePlansQuery.error, "Unable to load course plans."))
    }
  }, [coursePlansQuery.isError, coursePlansQuery.error])


  if (!canViewAdmissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admissions</CardTitle>
          <CardDescription>
            You do not have permission to view admissions. This page is available to super admins, admins, and staff.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const columns: ColumnDef<{ admission: Admission; lead: Admission["lead"] }>[] = [
    {
      header: "Admission",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.admission.id}</span>,
    },
    {
      header: "Lead",
      cell: ({ row }) => {
        if (!row.original.lead) {
          return <span className="font-mono text-xs">{row.original.admission.leadId}</span>
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
        )
      },
    },
    {
      header: "Plan",
      cell: ({ row }) => {
        const planName = (coursePlansQuery.data?.data ?? []).find((plan) => plan.id === row.original.admission.coursePlanId)?.name
        return planName ?? row.original.admission.coursePlanId
      },
    },
    {
      header: "Classes",
      cell: ({ row }) =>
        `${row.original.admission.baseClasses} + ${row.original.admission.extraClasses} = ${row.original.admission.finalClasses}`,
    },
    {
      header: "Start",
      cell: ({ row }) => formatDate(row.original.admission.startDate),
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.admission.status === "active" ? "secondary" : "outline"}>
          {row.original.admission.status}
        </Badge>
      ),
    },
    {
      header: "Created",
      cell: ({ row }) => formatDate(row.original.admission.createdAt),
    },
  ]

  const table = useReactTable({
    data: admissionsQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const total = admissionsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admissions</h1>
        <p className="text-sm text-muted-foreground">
          Manage admissions with plan, status, and schedule context.
        </p>
      </div>

      {canCreateAdmissions ? (
        <div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Admission
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Admissions list</CardTitle>
          <CardDescription>Filter by status and course plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value
              setSearchInput(value)
              debouncedSearchUpdate(value.trim())
            }}
            placeholder="Search by lead name, phone, or email"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={coursePlanId}
              onValueChange={(value) => {
                setCoursePlanId(value)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Course plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {(coursePlansQuery.data?.data ?? []).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      {admissionsQuery.isLoading ? "Loading admissions..." : "No admissions found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="text-muted-foreground">Total {total} admissions</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || admissionsQuery.isLoading}
              >
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || admissionsQuery.isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdmissionFormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
        }}
        initialLeadId={initialLeadId}
        onCreated={async (studentId) => {
          await queryClient.invalidateQueries({ queryKey: ["admissions"] })
          if (studentId) {
            toast.success("Student account created as part of admission")
          }
        }}
      />
    </div>
  )
}
