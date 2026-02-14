import { type ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-tables/data-table";
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
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  usePaginationConfig,
} from "@/lib/pagination-config";
import {
  canManageUsers,
  canViewOwnProfile,
  canViewUserList,
  type AppRole,
  type ManagedUserRole,
} from "@/lib/users-rbac";
import type { UserListItem, UserListResponse } from "@/pages/users/types";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type UsersListPageProps = {
  role: ManagedUserRole;
  title: string;
  description: string;
};

const endpointMap: Record<ManagedUserRole, string> = {
  student: "users/students",
  teacher: "users/teachers",
  staff: "users/staff",
  admin: "users/admins",
};

function UserDetailLink({
  role,
  id,
  children,
}: {
  role: ManagedUserRole;
  id: string;
  children: ReactNode;
}) {
  if (role === "student") {
    return (
      <Link
        to="/users/students/$id/$tab"
        params={{ id, tab: "profile" }}
        className="font-medium underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  }

  if (role === "teacher") {
    return (
      <Link
        to="/users/teachers/$id/$tab"
        params={{ id, tab: "profile" }}
        className="font-medium underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  }

  if (role === "staff") {
    return (
      <Link
        to="/users/staff/$id/$tab"
        params={{ id, tab: "profile" }}
        className="font-medium underline-offset-4 hover:underline"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      to="/users/admins/$id/$tab"
      params={{ id, tab: "profile" }}
      className="font-medium underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export function UsersListPage({
  role,
  title,
  description,
}: UsersListPageProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  const session = authClient.useSession();
  const viewerRole =
    (session.data?.user as { role?: AppRole } | undefined)?.role ?? "student";
  const queryClient = useQueryClient();
  const paginationConfigQuery = usePaginationConfig();
  const pageSizeOptions =
    paginationConfigQuery.data?.data.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS];
  const defaultPageSize =
    paginationConfigQuery.data?.data.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const canView = canViewUserList(viewerRole, role);
  const canManage = canManageUsers(viewerRole, role);

  useEffect(() => {
    setPageSize((current) =>
      current === DEFAULT_PAGE_SIZE ? defaultPageSize : current,
    );
  }, [defaultPageSize]);

  const query = useQuery({
    queryKey: ["users", role, search, page, pageSize],
    enabled: canView,
    queryFn: async (): Promise<UserListResponse> => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const response = await fetch(
        `${apiUrl}/api/v1/${endpointMap[role]}?${params}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      return response.json();
    },
  });

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            You do not have permission to view this list. Access is page-level
            restricted.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  useEffect(() => {
    if (query.isError) {
      toast.error(getErrorMessage(query.error, "Unable to load users."));
    }
  }, [query.isError, query.error]);

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
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", role] });
      setCreateOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      toast.success("User created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to create user."));
    },
  });

  const columns: ColumnDef<UserListItem>[] = [
    {
      id: "name",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
      header: "Name",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <UserDetailLink role={role} id={item.id}>
            {item.firstName} {item.lastName}
          </UserDetailLink>
        );
      },
    },
    { header: "Email", accessorKey: "email" },
    {
      id: "phone",
      accessorFn: (row) => row.phone ?? "",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.phone || "-"}</span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (row.isActive ? "active" : "inactive"),
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
        <Badge variant={row.original.isActive ? "secondary" : "outline"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  const selfRoleNote = canViewOwnProfile(viewerRole, role)
    ? " You can still view your own profile in read-only mode."
    : "";
  const total = query.data?.total ?? 0;

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
            <Plus className="mr-2 h-4 w-4" /> Create{" "}
            {title.endsWith("s") ? title.slice(0, -1) : title}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{title} directory</CardTitle>
          <CardDescription>Search by name, email, or phone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={query.data?.data ?? []}
            searchableColumnIds={["name", "email", "phone"]}
            searchPlaceholder="Search by name, email, or phone"
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
            isLoading={query.isLoading}
            loadingMessage="Loading users..."
            emptyMessage="No users found."
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
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
          />
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
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
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
              disabled={
                !firstName || !lastName || !email || password.length < 8
              }
            >
              Create
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
