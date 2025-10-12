"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPerformanceColor } from "@/lib/design-tokens";
import { formatCurrency, formatPercent, formatChange } from "@/lib/formatters";

interface PerformanceMetricProps {
  value: number;
  change?: number;
  changePercent?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showCurrency?: boolean;
  showPercentSign?: boolean;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function PerformanceMetric({
  value,
  change,
  changePercent,
  size = "md",
  showIcon = true,
  showCurrency = true,
  showPercentSign = true,
  className,
  label,
  compact = false,
}: PerformanceMetricProps) {
  // Determine performance direction
  const performanceValue = change !== undefined ? change : changePercent ?? 0;
  const isPositive = performanceValue > 0;
  const isNegative = performanceValue < 0;
  const isNeutral = performanceValue === 0;

  // Get appropriate colors
  const colors = getPerformanceColor(performanceValue);

  // Size classes
  const sizeClasses = {
    sm: {
      value: "text-sm font-semibold",
      change: "text-xs",
      icon: "h-3 w-3",
      gap: "gap-1",
    },
    md: {
      value: "text-lg font-bold",
      change: "text-sm",
      icon: "h-4 w-4",
      gap: "gap-1.5",
    },
    lg: {
      value: "text-2xl font-bold",
      change: "text-base",
      icon: "h-5 w-5",
      gap: "gap-2",
    },
  };

  const sizes = sizeClasses[size];

  // Format the main value
  const formattedValue = showCurrency ? formatCurrency(value) : value.toFixed(2);

  // Format the change values
  const formattedChange = change !== undefined ? formatChange(change, false) : null;
  const formattedPercent = changePercent !== undefined ? formatChange(changePercent, true) : null;

  // Icon component
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  if (compact) {
    return (
      <div className={cn("flex items-center", sizes.gap, className)}>
        <span className={cn(sizes.value)}>{formattedValue}</span>
        {(change !== undefined || changePercent !== undefined) && (
          <span className={cn("flex items-center", sizes.gap, colors.text)}>
            {showIcon && <Icon className={sizes.icon} />}
            {changePercent !== undefined && formattedPercent && (
              <span className={sizes.change}>{formattedPercent.text}</span>
            )}
            {change !== undefined && formattedChange && changePercent === undefined && (
              <span className={sizes.change}>{formattedChange.text}</span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </p>
      )}
      
      <div className="flex items-baseline gap-2">
        <span className={cn(sizes.value)}>{formattedValue}</span>
        
        {(change !== undefined || changePercent !== undefined) && (
          <div
            className={cn(
              "flex items-center rounded-full px-2 py-0.5",
              sizes.gap,
              colors.full
            )}
          >
            {showIcon && <Icon className={sizes.icon} />}
            
            <div className={cn("flex items-center", sizes.gap)}>
              {change !== undefined && formattedChange && (
                <span className={cn(sizes.change, "font-medium")}>
                  {formattedChange.text}
                </span>
              )}
              
              {changePercent !== undefined && formattedPercent && (
                <span className={cn(sizes.change, "font-medium")}>
                  {showPercentSign ? formattedPercent.text : formattedPercent.text.replace('%', '')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Variant: Inline Performance Badge
export function PerformanceBadge({
  value,
  isPercent = false,
  size = "md",
  showIcon = true,
}: {
  value: number;
  isPercent?: boolean;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const colors = getPerformanceColor(value);
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const formatted = isPercent ? formatPercent(value, 2, true) : formatChange(value, false).text;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-2.5 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        sizeClasses[size],
        colors.full
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {formatted}
    </span>
  );
}

// Variant: Minimal Performance Indicator
export function PerformanceIndicator({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const colors = getPerformanceColor(value);
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

  return (
    <div className={cn("flex items-center gap-1", colors.text, className)}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{formatPercent(value, 2, true)}</span>
    </div>
  );
}

