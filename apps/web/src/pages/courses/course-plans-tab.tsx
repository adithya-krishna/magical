import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Classes/week</TableHead>
                <TableHead>Total classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plansQuery.data?.data ?? []).map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{formatInrFromMinor(plan.price)}</TableCell>
                  <TableCell>{plan.durationMonths} months</TableCell>
                  <TableCell>{plan.classesPerWeek}</TableCell>
                  <TableCell>{plan.totalClasses}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "secondary" : "outline"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPlan(plan)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="sm" variant="destructive">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete course plan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes {plan.name}. Existing admissions keep stored totals.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(plan.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!plansQuery.data?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    {plansQuery.isLoading ? "Loading course plans..." : "No course plans available."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

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
