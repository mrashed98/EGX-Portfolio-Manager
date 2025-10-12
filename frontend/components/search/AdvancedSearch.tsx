"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface AdvancedSearchProps {
  placeholder?: string;
  onSearchChange: (search: string) => void;
  filters?: FilterOption[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (filters: Record<string, string[]>) => void;
  className?: string;
}

export function AdvancedSearch({
  placeholder = "Search...",
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  className = "",
}: AdvancedSearchProps) {
  const [search, setSearch] = useState("");
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(activeFilters);
  const debouncedSearch = useDebounce(search, 300);

  // Trigger callback when debounced search changes
  useState(() => {
    onSearchChange(debouncedSearch);
  });

  const handleFilterToggle = (filterId: string, value: string) => {
    const currentValues = localFilters[filterId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const newFilters = {
      ...localFilters,
      [filterId]: newValues,
    };

    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilter = (filterId: string) => {
    const newFilters = { ...localFilters };
    delete newFilters[filterId];
    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFilterChange?.({});
  };

  const activeFilterCount = Object.values(localFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange(e.target.value);
            }}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Button */}
        {filters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {filters.map((filter) => {
                  const activeValues = localFilters[filter.id] || [];
                  return (
                    <div key={filter.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">{filter.label}</label>
                        {activeValues.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearFilter(filter.id)}
                            className="h-6 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {filter.options.map((option) => {
                          const isActive = activeValues.includes(option.value);
                          return (
                            <Badge
                              key={option.value}
                              variant={isActive ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => handleFilterToggle(filter.id, option.value)}
                            >
                              {option.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([filterId, values]) => {
            const filter = filters.find((f) => f.id === filterId);
            if (!filter || values.length === 0) return null;

            return values.map((value) => {
              const option = filter.options.find((o) => o.value === value);
              if (!option) return null;

              return (
                <Badge key={`${filterId}-${value}`} variant="secondary" className="gap-1">
                  <span className="text-xs text-muted-foreground">{filter.label}:</span>
                  {option.label}
                  <button
                    onClick={() => handleFilterToggle(filterId, value)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}

