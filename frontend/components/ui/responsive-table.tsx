"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Label to show on mobile
  hideMobile?: boolean; // Hide this column on mobile
  primary?: boolean; // Primary column (always visible)
}

export interface Action<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  hidden?: (item: T) => boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  emptyState?: ReactNode;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  onRowClick,
  keyExtractor,
  emptyState,
  className = "",
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left p-3 text-sm font-medium text-muted-foreground ${column.className || ""}`}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`p-3 ${column.className || ""}`}>
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, idx) => {
                          if (action.hidden?.(item)) return null;
                          return (
                            <DropdownMenuItem
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                              className={action.variant === "destructive" ? "text-red-600" : ""}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const visibleActions = actions.filter((action) => !action.hidden?.(item));
          
          return (
            <Card
              key={keyExtractor(item)}
              className={`p-4 ${onRowClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
              onClick={() => onRowClick?.(item)}
            >
              <div className="space-y-3">
                {/* Primary content */}
                {columns
                  .filter((col) => !col.hideMobile)
                  .map((column) => {
                    const value = column.render ? column.render(item) : item[column.key];
                    const label = column.mobileLabel || column.label;

                    if (column.primary) {
                      return (
                        <div key={column.key} className="font-semibold text-lg">
                          {value}
                        </div>
                      );
                    }

                    return (
                      <div key={column.key} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{label}:</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    );
                  })}

                {/* Actions */}
                {visibleActions.length > 0 && (
                  <div className="flex gap-2 pt-2 border-t">
                    {visibleActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.variant === "destructive" ? "destructive" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                        className="flex-1"
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// Utility component for common table patterns
export function TableBadge({
  variant = "secondary",
  children,
}: {
  variant?: "default" | "secondary" | "outline" | "destructive";
  children: ReactNode;
}) {
  return (
    <Badge variant={variant} className="text-xs">
      {children}
    </Badge>
  );
}

export function TableStat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${trend ? trendColors[trend] : ""}`}>
        {value}
      </div>
    </div>
  );
}

