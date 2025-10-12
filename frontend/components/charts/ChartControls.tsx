"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Maximize2,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DateRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface ChartControlsProps {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onExport?: (format: "PNG" | "SVG" | "CSV") => void;
  onFullscreen?: () => void;
  showLegend?: boolean;
  onToggleLegend?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "1W", label: "1 Week" },
  { value: "1M", label: "1 Month" },
  { value: "3M", label: "3 Months" },
  { value: "6M", label: "6 Months" },
  { value: "1Y", label: "1 Year" },
  { value: "ALL", label: "All Time" },
];

export function ChartControls({
  dateRange = "1M",
  onDateRangeChange,
  onExport,
  onFullscreen,
  showLegend,
  onToggleLegend,
  title,
  className = "",
  compact = false,
}: ChartControlsProps) {
  const [activeRange, setActiveRange] = useState<DateRange>(dateRange);

  const handleDateRangeChange = (range: DateRange) => {
    setActiveRange(range);
    onDateRangeChange?.(range);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Date Range Selector - Compact */}
        <div className="flex items-center gap-1">
          {dateRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeRange === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateRangeChange(option.value)}
              className="h-7 px-2 text-xs"
            >
              {option.value}
            </Button>
          ))}
        </div>

        {/* Actions Dropdown */}
        {(onExport || onFullscreen || onToggleLegend) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExport && (
                <>
                  <DropdownMenuItem onClick={() => onExport("PNG")}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("SVG")}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("CSV")}>
                    Export Data (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onToggleLegend && (
                <DropdownMenuItem onClick={onToggleLegend}>
                  {showLegend ? "Hide" : "Show"} Legend
                </DropdownMenuItem>
              )}
              {onFullscreen && (
                <DropdownMenuItem onClick={onFullscreen}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Fullscreen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      {/* Title Section */}
      {title && (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <Badge variant="secondary" className="text-xs">
            {dateRangeOptions.find((opt) => opt.value === activeRange)?.label}
          </Badge>
        </div>
      )}

      {/* Controls Section */}
      <div className="flex items-center gap-2">
        {/* Date Range Selector */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          {dateRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeRange === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateRangeChange(option.value)}
              className="h-8 px-3 text-xs font-medium"
            >
              {option.value}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        {(onExport || onFullscreen || onToggleLegend) && (
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {onToggleLegend && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleLegend}
                className="h-8 px-3 text-xs"
                title={showLegend ? "Hide Legend" : "Show Legend"}
              >
                Legend
              </Button>
            )}

            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                    <Download className="mr-1 h-3 w-3" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onExport("PNG")}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("SVG")}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("CSV")}>
                    Export Data (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFullscreen}
                className="h-8 w-8 p-0"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manage chart date range state
 * 
 * @example
 * ```typescript
 * const { dateRange, setDateRange, getDateFilter } = useDateRange("1M");
 * 
 * const filteredData = data.filter(item => 
 *   new Date(item.date) >= getDateFilter()
 * );
 * ```
 */
export function useDateRange(initialRange: DateRange = "1M") {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);

  const getDateFilter = (): Date => {
    const now = new Date();
    
    switch (dateRange) {
      case "1W":
        return new Date(now.setDate(now.getDate() - 7));
      case "1M":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3M":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6M":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1Y":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "ALL":
        return new Date(0); // Beginning of time
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  };

  const getDaysCount = (): number => {
    switch (dateRange) {
      case "1W": return 7;
      case "1M": return 30;
      case "3M": return 90;
      case "6M": return 180;
      case "1Y": return 365;
      case "ALL": return Infinity;
      default: return 30;
    }
  };

  return {
    dateRange,
    setDateRange,
    getDateFilter,
    getDaysCount,
  };
}

