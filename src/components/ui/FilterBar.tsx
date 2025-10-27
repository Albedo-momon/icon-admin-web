import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, X, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  selectedFilters?: Record<string, string[]>;
  onFiltersChange?: (filters: Record<string, string[]>) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDateFilter?: boolean;
  className?: string;
  compact?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filterGroups = [],
  selectedFilters = {},
  onFiltersChange,
  dateRange,
  onDateRangeChange,
  showDateFilter = false,
  className,
  compact = false,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFilterChange = (groupKey: string, optionValue: string, checked: boolean) => {
    if (!onFiltersChange) return;

    const currentGroupFilters = selectedFilters[groupKey] || [];
    const group = filterGroups.find(g => g.key === groupKey);
    
    let newGroupFilters: string[];
    
    if (group?.multiple) {
      if (checked) {
        newGroupFilters = [...currentGroupFilters, optionValue];
      } else {
        newGroupFilters = currentGroupFilters.filter(v => v !== optionValue);
      }
    } else {
      newGroupFilters = checked ? [optionValue] : [];
    }

    onFiltersChange({
      ...selectedFilters,
      [groupKey]: newGroupFilters,
    });
  };

  const clearFilter = (groupKey: string, optionValue?: string) => {
    if (!onFiltersChange) return;

    if (optionValue) {
      const currentGroupFilters = selectedFilters[groupKey] || [];
      const newGroupFilters = currentGroupFilters.filter(v => v !== optionValue);
      onFiltersChange({
        ...selectedFilters,
        [groupKey]: newGroupFilters,
      });
    } else {
      const newFilters = { ...selectedFilters };
      delete newFilters[groupKey];
      onFiltersChange(newFilters);
    }
  };

  const clearAllFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
    if (onDateRangeChange) {
      onDateRangeChange({});
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(selectedFilters).forEach(filters => {
      count += filters.length;
    });
    if (dateRange?.from || dateRange?.to) {
      count += 1;
    }
    return count;
  };

  const getFilterLabel = (groupKey: string, optionValue: string) => {
    const group = filterGroups.find(g => g.key === groupKey);
    const option = group?.options.find(o => o.value === optionValue);
    return option?.label || optionValue;
  };

  const formatDateRange = () => {
    if (!dateRange?.from && !dateRange?.to) return "Select date range";
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`;
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, "MMM dd, yyyy")}`;
    }
    if (dateRange.to) {
      return `Until ${format(dateRange.to, "MMM dd, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Controls */}
      <div className={cn(
        "flex gap-2",
        compact ? "flex-col sm:flex-row" : "flex-row"
      )}>
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
            aria-label="Search items"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {filterGroups.map((group) => {
            const selectedCount = selectedFilters[group.key]?.length || 0;
            
            return (
              <DropdownMenu key={group.key}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    aria-label={`Filter by ${group.label}`}
                    aria-expanded="false"
                  >
                    <Filter className="h-4 w-4" />
                    {group.label}
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {selectedCount}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {group.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selectedFilters[group.key]?.includes(option.value) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange(group.key, option.value, checked)
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                          <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">
                            {option.count}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          {/* Date Range Filter */}
          {showDateFilter && (
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  aria-label="Select date range"
                  aria-expanded="false"
                >
                  <Calendar className="h-4 w-4" />
                  {formatDateRange()}
                  {(dateRange?.from || dateRange?.to) && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={dateRange as any}
                  onSelect={(range: any) => {
                    onDateRangeChange?.(range || {});
                    if (range?.from && range?.to) {
                      setIsDatePickerOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Clear All Filters */}
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([groupKey, values]) =>
            values.map((value) => (
              <Badge key={`${groupKey}-${value}`} variant="secondary" className="gap-1">
                {getFilterLabel(groupKey, value)}
                <button
                  onClick={() => clearFilter(groupKey, value)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
          
          {(dateRange?.from || dateRange?.to) && (
            <Badge variant="secondary" className="gap-1">
              {formatDateRange()}
              <button
                onClick={() => onDateRangeChange?.({})}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};