import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { InstrumentFormSheet } from "@/pages/instruments/instrument-form-sheet"
import type { Instrument, InstrumentFormValues, InstrumentsResponse } from "@/pages/instruments/types"

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return fallback
}

export function InstrumentsPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const session = authClient.useSession()
  const role = (session.data?.user as { role?: string } | undefined)?.role
  const canManage = role === "super_admin" || role === "admin"
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null)

  const instrumentsQuery = useQuery({
    queryKey: ["instruments", search],
    queryFn: async (): Promise<InstrumentsResponse> => {
      const params = new URLSearchParams()
      if (search.trim()) {
        params.set("search", search.trim())
      }
      const queryString = params.toString()
      const response = await fetch(
        `${apiUrl}/api/v1/instruments${queryString ? `?${queryString}` : ""}`,
        { credentials: "include" }
      )

      if (!response.ok) {
        throw new Error("Failed to load instruments")
      }

      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: InstrumentFormValues) => {
      const response = await fetch(`${apiUrl}/api/v1/instruments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        throw new Error("Failed to create instrument")
      }
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instruments"] })
      setFormOpen(false)
      setEditingInstrument(null)
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to create instrument.")),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: InstrumentFormValues }) => {
      const response = await fetch(`${apiUrl}/api/v1/instruments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        throw new Error("Failed to update instrument")
      }
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instruments"] })
      setFormOpen(false)
      setEditingInstrument(null)
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to update instrument.")),
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/api/v1/instruments/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to archive instrument")
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["instruments"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Unable to archive instrument.")),
  })

  const columns = useMemo<ColumnDef<Instrument>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
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
                    setEditingInstrument(row.original)
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
                      <AlertDialogTitle>Archive instrument?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This hides the instrument from active course creation.
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
    data: instrumentsQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (instrumentsQuery.isError) {
      toast.error(getErrorMessage(instrumentsQuery.error, "Unable to load instruments."))
    }
  }, [instrumentsQuery.isError, instrumentsQuery.error])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Instruments</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and archive instruments.</p>
        </div>
        {canManage ? (
          <Button
            onClick={() => {
              setEditingInstrument(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Instrument
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instrument list</CardTitle>
          <CardDescription>
            Need courses too? Go to <Link to="/courses" className="underline">Courses</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search instruments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

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
                      {instrumentsQuery.isLoading ? "Loading..." : "No instruments found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InstrumentFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        instrument={editingInstrument}
        isSaving={isSaving}
        onSubmit={async (values) => {
          if (editingInstrument) {
            await updateMutation.mutateAsync({ id: editingInstrument.id, values })
            return
          }
          await createMutation.mutateAsync(values)
        }}
      />
    </div>
  )
}
