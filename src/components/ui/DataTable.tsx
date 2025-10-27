import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => any;
}

export interface RowAction<T> {
  label: string | ((row: T) => string);
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  rowActions?: RowAction<T>[];
  emptyMessage?: string;
  className?: string;
  getRowId?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortBy,
  sortDirection,
  onSort,
  pagination,
  rowActions = [],
  emptyMessage = "No data available",
  className,
  getRowId = (row: T) => (row as any).id || (row as any).key || String(row),
  onRowClick,
}: DataTableProps<T>) {
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(null);

  const currentSortBy = sortBy ?? internalSortBy;
  const currentSortDirection = sortDirection ?? internalSortDirection;

  const handleSort = (key: string) => {
    let newDirection: SortDirection = "asc";
    
    if (currentSortBy === key) {
      // Toggle between asc and desc only
      newDirection = currentSortDirection === "asc" ? "desc" : "asc";
    }

    if (onSort) {
      onSort(key, newDirection);
    } else {
      setInternalSortBy(key);
      setInternalSortDirection(newDirection);
    }
  };

  const sortedData = useMemo(() => {
    if (!currentSortBy || !currentSortDirection) return data;

    const column = columns.find(col => col.key === currentSortBy);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let aValue = column.accessor ? column.accessor(a) : (a as any)[column.key];
      let bValue = column.accessor ? column.accessor(b) : (b as any)[column.key];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return currentSortDirection === "asc" ? 1 : -1;
      if (bValue == null) return currentSortDirection === "asc" ? -1 : 1;

      // Convert to string for comparison if needed
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return currentSortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return currentSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, currentSortBy, currentSortDirection, columns]);

  const isAllSelected = selectable && data.length > 0 && selectedRows.length === data.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(isAllSelected ? [] : [...data]);
  };

  const handleSelectRow = (row: T) => {
    if (!onSelectionChange) return;
    
    const rowId = getRowId(row);
    const isSelected = selectedRows.some(selectedRow => getRowId(selectedRow) === rowId);
    
    if (isSelected) {
      onSelectionChange(selectedRows.filter(selectedRow => getRowId(selectedRow) !== rowId));
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (currentSortBy !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    
    if (currentSortDirection === "asc") {
      return <ChevronUp className="h-4 w-4" />;
    }
    
    if (currentSortDirection === "desc") {
      return <ChevronDown className="h-4 w-4" />;
    }
    
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  const renderCell = (column: Column<T>, row: T, index: number) => {
    if (column.render) {
      return column.render(column.accessor ? column.accessor(row) : (row as any)[column.key], row, index);
    }
    
    const value = column.accessor ? column.accessor(row) : (row as any)[column.key];
    return value?.toString() || "";
  };

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label="Data table with sorting and pagination">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                  )}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  aria-sort={
                    column.sortable && currentSortBy === column.key
                      ? currentSortDirection === 'asc'
                        ? 'ascending'
                        : currentSortDirection === 'desc'
                        ? 'descending'
                        : 'none'
                      : 'none'
                  }
                >
                  <div className="flex items-center gap-2 text-foreground">
                    {column.header || column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              
              {rowActions.length > 0 && (
                <TableHead className="w-12" aria-label="Actions">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectable && selectedRows.some(selectedRow => getRowId(selectedRow) === rowId);
                
                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      isSelected && "bg-muted/50",
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(row)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {renderCell(column, row, index)}
                      </TableCell>
                    ))}
                    
                    {rowActions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                disabled={action.disabled?.(row)}
                                className={cn(
                                  action.variant === "destructive" && "text-destructive focus:text-destructive"
                                )}
                              >
                                {typeof action.label === "function" ? action.label(row) : action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total} results
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => pagination.onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.pageSize))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}