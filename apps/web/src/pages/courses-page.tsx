import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { authClient } from "@/lib/auth-client"
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

export function CoursesPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const role = (session.data?.user as { role?: string } | undefined)?.role
  const canManage = role === "super_admin" || role === "admin"
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [difficulty, setDifficulty] = useState<string>("all")
  const [instrumentId, setInstrumentId] = useState<string>("all")
  const [activeStatus, setActiveStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<string>("asc")
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
    queryKey: ["courses", search, page, difficulty, instrumentId, activeStatus, sortBy, sortOrder],
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (search) params.set("search", search)
      if (difficulty !== "all") params.set("difficulty", difficulty)
      if (instrumentId !== "all") params.set("instrumentId", instrumentId)
      if (activeStatus !== "all") params.set("isActive", activeStatus)
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

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
        header: "Course",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.instrumentName}</p>
          </div>
        ),
      },
      {
        header: "Difficulty",
        cell: ({ row }) => <Badge variant="outline">{row.original.difficulty}</Badge>,
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Active" : "Archived"}
          </Badge>
        ),
      },
      {
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

  const table = useReactTable({
    data: coursesQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const total = coursesQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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

      <Card>
        <CardHeader>
          <CardTitle>Course catalog</CardTitle>
          <CardDescription>
            Manage instruments in <Link to="/instruments" className="underline">Instruments</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search by course name"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
                debouncedSearch(event.target.value.trim())
              }}
            />
            <Select value={instrumentId} onValueChange={setInstrumentId}>
              <SelectTrigger>
                <SelectValue placeholder="Instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instruments</SelectItem>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeStatus} onValueChange={setActiveStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="instrument">Instrument</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedCourseId(row.original.id)
                        setDetailsOpen(true)
                      }}
                    >
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
                      {coursesQuery.isLoading ? "Loading..." : "No courses found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total {total} courses</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
