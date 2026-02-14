import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-tables/data-table"
import { formatInrFromMinor } from "@/lib/money"
import type { CoursePlan, CoursePlansResponse } from "@/pages/admissions/types"
import { CoursePlanFormSheet, type CoursePlanFormValues } from "@/pages/courses/course-plan-form-sheet"

type CoursePlansTabProps = {
  canManage: boolean
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return fallback
}

export function CoursePlansTab({ canManage }: CoursePlansTabProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<CoursePlan | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const plansQuery = useQuery({
    queryKey: ["course-plans", "all"],
    queryFn: async (): Promise<CoursePlansResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/course-plans`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load course plans")
      }
      return response.json()
    },
  })

  useEffect(() => {
    if (plansQuery.isError) {
      toast.error(getErrorMessage(plansQuery.error, "Unable to load course plans."))
    }
  }, [plansQuery.isError, plansQuery.error])

  const createMutation = useMutation({
    mutationFn: async (values: CoursePlanFormValues) => {
      const response = await fetch(`${apiUrl}/api/v1/course-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || "Failed to create course plan")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course-plans"] })
      toast.success("Course plan created")
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create course plan."))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (values: CoursePlanFormValues) => {
      if (!editingPlan) {
        throw new Error("No course plan selected")
      }

      const response = await fetch(`${apiUrl}/api/v1/course-plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || "Failed to update course plan")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course-plans"] })
      toast.success("Course plan updated")
      setEditingPlan(null)
      setFormOpen(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update course plan."))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/course-plans/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || "Failed to delete course plan")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course-plans"] })
      toast.success("Course plan deleted")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to delete course plan."))
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const plans = plansQuery.data?.data ?? []

  const columns: ColumnDef<CoursePlan>[] = [
    { id: "name", header: "Name", accessorKey: "name" },
    {
      id: "price",
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatInrFromMinor(row.original.price),
    },
    {
      id: "duration_months",
      accessorKey: "durationMonths",
      header: "Duration",
      cell: ({ row }) => `${row.original.durationMonths} months`,
    },
    {
      id: "classes_per_week",
      accessorKey: "classesPerWeek",
      header: "Classes/week",
    },
    {
      id: "total_classes",
      accessorKey: "totalClasses",
      header: "Total classes",
    },
    {
      id: "status",
      accessorFn: (row) => (row.isActive ? "active" : "inactive"),
      filterFn: (row, columnId, filterValues) => {
        const selected = Array.isArray(filterValues) ? (filterValues as string[]) : []
        if (!selected.length) return true
        return selected.includes(String(row.getValue(columnId)))
      },
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "secondary" : "outline"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        canManage ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation()
                setEditingPlan(row.original)
                setFormOpen(true)
              }}
            >
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" size="sm" variant="destructive" onClick={(event) => event.stopPropagation()}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete course plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes {row.original.name}. Existing admissions keep stored totals.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(row.original.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Plans</CardTitle>
        <CardDescription>
          Configure plan pricing, duration and classes. Only admins and super admins can edit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage ? <Button onClick={() => setFormOpen(true)}>New Course Plan</Button> : null}

        <DataTable
          columns={columns}
          data={plans}
          searchableColumnIds={["name"]}
          searchPlaceholder="Search course plans"
          filters={[
            {
              title: "Status",
              columnId: "status",
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
          isLoading={plansQuery.isLoading}
          loadingMessage="Loading course plans..."
          emptyMessage="No course plans available."
        />

        <CoursePlanFormSheet
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingPlan(null)
            }
          }}
          plan={editingPlan}
          isSaving={isSaving}
          onSubmit={async (values: CoursePlanFormValues) => {
            if (editingPlan) {
              await updateMutation.mutateAsync(values)
              return
            }
            await createMutation.mutateAsync(values)
          }}
        />
      </CardContent>
    </Card>
  )
}
