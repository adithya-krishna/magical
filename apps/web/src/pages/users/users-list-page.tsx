import { type ReactNode, useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import {
  canManageUsers,
  canViewOwnProfile,
  canViewUserList,
  type AppRole,
  type ManagedUserRole,
} from "@/lib/users-rbac"
import type { UserListItem, UserListResponse } from "@/pages/users/types"

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return fallback
}

type UsersListPageProps = {
  role: ManagedUserRole
  title: string
  description: string
}

const endpointMap: Record<ManagedUserRole, string> = {
  student: "users/students",
  teacher: "users/teachers",
  staff: "users/staff",
  admin: "users/admins",
}

function UserDetailLink({
  role,
  id,
  children,
}: {
  role: ManagedUserRole
  id: string
  children: ReactNode
}) {
  if (role === "student") {
    return (
      <Link to="/users/students/$id/$tab" params={{ id, tab: "profile" }} className="font-medium underline-offset-4 hover:underline">
        {children}
      </Link>
    )
  }

  if (role === "teacher") {
    return (
      <Link to="/users/teachers/$id/$tab" params={{ id, tab: "profile" }} className="font-medium underline-offset-4 hover:underline">
        {children}
      </Link>
    )
  }

  if (role === "staff") {
    return (
      <Link to="/users/staff/$id/$tab" params={{ id, tab: "profile" }} className="font-medium underline-offset-4 hover:underline">
        {children}
      </Link>
    )
  }

  return (
    <Link to="/users/admins/$id/$tab" params={{ id, tab: "profile" }} className="font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

export function UsersListPage({ role, title, description }: UsersListPageProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const session = authClient.useSession()
  const viewerRole = ((session.data?.user as { role?: AppRole } | undefined)?.role ?? "student")
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const canView = canViewUserList(viewerRole, role)
  const canManage = canManageUsers(viewerRole, role)

  const query = useQuery({
    queryKey: ["users", role, search],
    enabled: canView,
    queryFn: async (): Promise<UserListResponse> => {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}?${params}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load users")
      }
      return response.json()
    },
  })

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            You do not have permission to view this list. Access is page-level restricted.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  useEffect(() => {
    if (query.isError) {
      toast.error(getErrorMessage(query.error, "Unable to load users."))
    }
  }, [query.isError, query.error])

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/v1/${endpointMap[role]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          password,
          isActive: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create user")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", role] })
      setCreateOpen(false)
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setPassword("")
      toast.success("User created")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create user."))
    },
  })

  const columns: ColumnDef<UserListItem>[] = [
    {
      header: "Name",
        cell: ({ row }) => {
          const item = row.original
          return (
            <UserDetailLink role={role} id={item.id}>
              {item.firstName} {item.lastName}
            </UserDetailLink>
          )
        },
      },
    { header: "Email", accessorKey: "email" },
    {
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-",
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "secondary" : "outline"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ]

  const table = useReactTable({
    data: query.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const selfRoleNote = canViewOwnProfile(viewerRole, role)
    ? " You can still view your own profile in read-only mode."
    : ""

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {description}
          {selfRoleNote}
        </p>
      </div>

      {canManage ? (
        <div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create {title.endsWith("s") ? title.slice(0, -1) : title}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{title} directory</CardTitle>
          <CardDescription>Search by name, email, or phone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
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
                    <TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                      {query.isLoading ? "Loading users..." : "No users found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              Create {title.endsWith("s") ? title.slice(0, -1) : title}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label>First name</Label>
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <PhoneInput
                defaultCountry="IN"
                international
                value={phone}
                onChange={(value) => setPhone(value ?? "")}
              />
            </div>
            <div className="grid gap-2">
              <Label>Temporary password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!firstName || !lastName || !email || password.length < 8}
            >
              Create
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
