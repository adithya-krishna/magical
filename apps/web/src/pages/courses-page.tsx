import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { type ColumnDef } from "@tanstack/react-table"
import debounce from "lodash/debounce"
import { Plus } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  usePaginationConfig,
} from "@/lib/pagination-config"
import { CoursePlansTab } from "@/pages/courses/course-plans-tab"
import { CourseDetailsSheet } from "@/pages/courses/course-details-sheet"
import { CourseFormSheet } from "@/pages/courses/course-form-sheet"
import type {
  Course,
  CourseFormValues,
  CourseResponse,
  CoursesResponse,
  CourseTeachersResponse,
  InstrumentOption,
  TeachersResponse,
} from "@/pages/courses/types"
import type { InstrumentsResponse } from "@/pages/instruments/types"

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return fallback
}

export function CoursesPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const paginationConfigQuery = usePaginationConfig()
  const pageSizeOptions =
    paginationConfigQuery.data?.data.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS]
  const defaultPageSize =
    paginationConfigQuery.data?.data.defaultPageSize ?? DEFAULT_PAGE_SIZE
  const session = authClient.useSession()
  const role = (session.data?.user as { role?: string } | undefined)?.role
  const canManage = role === "super_admin" || role === "admin"
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value)
        setPage(1)
      }, 300),
    []
  )

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  useEffect(() => {
    setPageSize((current) => (current === DEFAULT_PAGE_SIZE ? defaultPageSize : current))
  }, [defaultPageSize])

  const instrumentsQuery = useQuery({
    queryKey: ["instruments", "all"],
    queryFn: async (): Promise<InstrumentsResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/instruments`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load instruments")
      }
      return response.json()
    },
  })

  const teachersQuery = useQuery({
    queryKey: ["teachers"],
    queryFn: async (): Promise<TeachersResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/users?roles=teacher`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load teachers")
      }
      return response.json()
    },
  })

  const coursesQuery = useQuery({
    queryKey: ["courses", search, page, pageSize],
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set("search", search)
      params.set("sortBy", "name")
      params.set("sortOrder", "asc")

      const response = await fetch(`${apiUrl}/api/v1/courses?${params}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load courses")
      }
      return response.json()
    },
  })

  const courseDetailsQuery = useQuery({
    queryKey: ["course", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: async (): Promise<CourseResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/courses/${selectedCourseId}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load course details")
      }
      return response.json()
    },
  })

  const courseTeachersQuery = useQuery({
    queryKey: ["course-teachers", selectedCourseId],
    enabled: Boolean(selectedCourseId),
    queryFn: async (): Promise<CourseTeachersResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/courses/${selectedCourseId}/teachers`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load course teachers")
      }
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const response = await fetch(`${apiUrl}/api/v1/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          description: values.description || undefined,
        }),
      })
      if (!response.ok) throw new Error("Failed to create course")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] })
      setFormOpen(false)
      setEditingCourse(null)
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to create course.")),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CourseFormValues }) => {
      const response = await fetch(`${apiUrl}/api/v1/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...values, description: values.description || undefined }),
      })
      if (!response.ok) throw new Error("Failed to update course")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] })
      if (selectedCourseId) {
        await queryClient.invalidateQueries({ queryKey: ["course", selectedCourseId] })
      }
      setFormOpen(false)
      setEditingCourse(null)
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update course.")),
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to archive course")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to archive course.")),
  })

  const assignTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      if (!selectedCourseId) return
      const response = await fetch(`${apiUrl}/api/v1/courses/${selectedCourseId}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teacherId }),
      })
      if (!response.ok) throw new Error("Failed to assign teacher")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course-teachers", selectedCourseId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to assign teacher.")),
  })

  const removeTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      if (!selectedCourseId) return
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${selectedCourseId}/teachers/${teacherId}`,
        { method: "DELETE", credentials: "include" }
      )
      if (!response.ok) throw new Error("Failed to remove teacher")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["course-teachers", selectedCourseId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to remove teacher.")),
  })

  useEffect(() => {
    if (coursesQuery.isError) {
      toast.error(getErrorMessage(coursesQuery.error, "Unable to load courses."))
    }
  }, [coursesQuery.isError, coursesQuery.error])

  useEffect(() => {
    if (instrumentsQuery.isError) {
      toast.error(getErrorMessage(instrumentsQuery.error, "Unable to load instruments."))
    }
  }, [instrumentsQuery.isError, instrumentsQuery.error])

  useEffect(() => {
    if (teachersQuery.isError) {
      toast.error(getErrorMessage(teachersQuery.error, "Unable to load teachers."))
    }
  }, [teachersQuery.isError, teachersQuery.error])

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Course",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.instrumentName}</p>
          </div>
        ),
      },
      {
        id: "instrument_name",
        accessorKey: "instrumentName",
        filterFn: (row, columnId, filterValues) => {
          const selected = Array.isArray(filterValues)
            ? (filterValues as string[])
            : []
          if (!selected.length) {
            return true
          }
          return selected.includes(String(row.getValue(columnId)))
        },
        header: "Instrument",
        cell: ({ row }) => row.original.instrumentName,
      },
      {
        id: "difficulty",
        accessorKey: "difficulty",
        filterFn: (row, columnId, filterValues) => {
          const selected = Array.isArray(filterValues)
            ? (filterValues as string[])
            : []
          if (!selected.length) {
            return true
          }
          return selected.includes(String(row.getValue(columnId)))
        },
        header: "Difficulty",
        cell: ({ row }) => <Badge variant="outline">{row.original.difficulty}</Badge>,
      },
      {
        id: "status",
        accessorFn: (row) => (row.isActive ? "active" : "archived"),
        filterFn: (row, columnId, filterValues) => {
          const selected = Array.isArray(filterValues)
            ? (filterValues as string[])
            : []
          if (!selected.length) {
            return true
          }
          return selected.includes(String(row.getValue(columnId)))
        },
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Active" : "Archived"}
          </Badge>
        ),
      },
      {
        id: "updated_at",
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  ...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditingCourse(row.original)
                    setFormOpen(true)
                  }}
                >
                  Update
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                      Archive
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive course?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Archived courses are hidden from admission-ready flows.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => archiveMutation.mutate(row.original.id)}>
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [archiveMutation, canManage]
  )

  const total = coursesQuery.data?.total ?? 0

  const instruments = (instrumentsQuery.data?.data ?? []) as InstrumentOption[]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Manage courses, difficulty levels, and teacher assignment.
          </p>
        </div>
        {canManage ? (
          <Button
            onClick={() => {
              setEditingCourse(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Course
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="catalog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="plans">Course Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Course catalog</CardTitle>
              <CardDescription>
                Manage instruments in <Link to="/instruments" className="underline">Instruments</Link>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataTable
                columns={columns}
                data={coursesQuery.data?.data ?? []}
                searchableColumnIds={["name", "instrument_name"]}
                searchPlaceholder="Search by course or instrument"
                filters={[
                  {
                    title: "Instrument",
                    columnId: "instrument_name",
                    options: instruments.map((instrument) => ({
                      label: instrument.name,
                      value: instrument.name,
                    })),
                  },
                  {
                    title: "Difficulty",
                    columnId: "difficulty",
                    options: [
                      { label: "Beginner", value: "beginner" },
                      { label: "Intermediate", value: "intermediate" },
                      { label: "Advanced", value: "advanced" },
                    ],
                  },
                  {
                    title: "Status",
                    columnId: "status",
                    options: [
                      { label: "Active", value: "active" },
                      { label: "Archived", value: "archived" },
                    ],
                  },
                ]}
                isLoading={coursesQuery.isLoading}
                loadingMessage="Loading courses..."
                emptyMessage="No courses found."
                pagination={{
                  page,
                  pageSize,
                  total,
                  onPageChange: setPage,
                  onPageSizeChange: (nextPageSize) => {
                    setPageSize(nextPageSize)
                    setPage(1)
                  },
                }}
                pageSizeOptions={pageSizeOptions}
                searchValue={searchInput}
                onSearchChange={(value) => {
                  setSearchInput(value)
                  debouncedSearch(value.trim())
                }}
                onRowClick={(course) => {
                  setSelectedCourseId(course.id)
                  setDetailsOpen(true)
                }}
              />

              <div className="text-sm text-muted-foreground">Total {total} courses</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <CoursePlansTab canManage={canManage} />
        </TabsContent>
      </Tabs>

      <CourseFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editingCourse}
        instruments={instruments}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onSubmit={async (values) => {
          if (editingCourse) {
            await updateMutation.mutateAsync({ id: editingCourse.id, values })
            return
          }
          await createMutation.mutateAsync(values)
        }}
      />

      <CourseDetailsSheet
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open)
          if (!open) {
            setSelectedCourseId(null)
          }
        }}
        course={courseDetailsQuery.data?.data}
        teachers={courseTeachersQuery.data?.data ?? []}
        teacherOptions={teachersQuery.data?.data ?? []}
        canManage={canManage}
        onAssignTeacher={async (teacherId) => {
          await assignTeacherMutation.mutateAsync(teacherId)
        }}
        onRemoveTeacher={async (teacherId) => {
          await removeTeacherMutation.mutateAsync(teacherId)
        }}
      />
    </div>
  )
}
