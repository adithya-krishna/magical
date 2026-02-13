import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./dt-column-toggle";

import { DataTableFacetedFilter } from "./dt-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters?: Array<{
    title: string;
    columnId: string;
    options: { label: string; value: string }[];
  }>;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  filters,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter);

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder ?? "Search..."}
          value={searchValue ?? ((table.getState().globalFilter as string) ?? "")}
          onChange={(event) => {
            const value = event.target.value;
            table.setGlobalFilter(value);
            onSearchChange?.(value);
          }}
          className="h-8 w-[150px] lg:w-[250px] bg-card"
        />
        {(filters ?? []).map((filter) => {
          const column = table.getColumn(filter.columnId);
          if (!column || filter.options.length === 0) {
            return null;
          }

          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          );
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
