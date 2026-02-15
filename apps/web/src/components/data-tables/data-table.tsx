import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  type PaginationState,
  type Updater,
  useReactTable,
  VisibilityState,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { DataTablePagination } from "./dt-pagination";
import { DataTableToolbar } from "./dt-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchableColumnIds?: string[];
  searchPlaceholder?: string;
  filters?: Array<{
    title: string;
    columnId: string;
    options: { label: string; value: string }[];
  }>;
  initialColumnVisibility?: VisibilityState;
  initialColumnFilters?: ColumnFiltersState;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  pageSizeOptions?: number[];
}

const DEFAULT_SEARCHABLE_COLUMN_IDS = ["name", "full_name", "email", "phone"];

const multiValueFilter: FilterFn<unknown> = (
  row,
  columnId,
  filterValues: string[] | string | undefined,
) => {
  if (!filterValues || (Array.isArray(filterValues) && filterValues.length === 0)) {
    return true;
  }

  const selected = Array.isArray(filterValues) ? filterValues : [filterValues];
  const rowValue = row.getValue(columnId);

  if (Array.isArray(rowValue)) {
    return rowValue.some((value) => selected.includes(String(value)));
  }

  return selected.includes(String(rowValue));
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchableColumnIds,
  searchPlaceholder,
  filters,
  initialColumnVisibility,
  initialColumnFilters,
  onRowClick,
  isLoading,
  emptyMessage = "No results.",
  loadingMessage = "Loading...",
  searchValue,
  onSearchChange,
  pagination,
  pageSizeOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialColumnFilters ?? [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {},
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const searchIds = searchableColumnIds?.length
    ? searchableColumnIds
    : DEFAULT_SEARCHABLE_COLUMN_IDS;

  const globalFilterFn: FilterFn<TData> = (row: Row<TData>, _, value) => {
    const query = String(value ?? "").trim().toLowerCase();
    if (!query) {
      return true;
    }

    return searchIds.some((columnId) => {
      const columnValue = row.getValue(columnId);

      if (columnValue == null) {
        return false;
      }

      if (Array.isArray(columnValue)) {
        return columnValue
          .map((item) => String(item).toLowerCase())
          .some((item) => item.includes(query));
      }

      return String(columnValue).toLowerCase().includes(query);
    });
  };

  const isManualPagination = Boolean(pagination);
  const effectivePagination: PaginationState = pagination
    ? {
        pageIndex: Math.max(0, pagination.page - 1),
        pageSize: pagination.pageSize,
      }
    : paginationState;

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const nextState =
      typeof updater === "function" ? updater(effectivePagination) : updater;

    if (pagination) {
      const nextPage = nextState.pageIndex + 1;
      if (nextPage !== pagination.page) {
        pagination.onPageChange(nextPage);
      }
      if (nextState.pageSize !== pagination.pageSize) {
        pagination.onPageSizeChange(nextState.pageSize);
      }
      return;
    }

    setPaginationState(nextState);
  };

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      multiValue: multiValueFilter as FilterFn<TData>,
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    globalFilterFn,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: isManualPagination,
    pageCount: pagination
      ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
      : undefined,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: searchValue ?? globalFilter,
      pagination: effectivePagination,
    },
  });

  return (
    <>
      <DataTableToolbar
        table={table}
        filters={filters}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
      />
      <div className="rounded-md border bg-card shadow-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loadingMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={
                    onRowClick
                      ? () => {
                          onRowClick(row.original);
                        }
                      : undefined
                  }
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
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          table={table}
          totalRows={pagination?.total}
          pageSizeOptions={pageSizeOptions}
        />
      </div>
    </>
  );
}
