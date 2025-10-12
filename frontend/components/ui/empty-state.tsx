"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Action {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

interface EmptyStateProps {
  icon?: React.ReactNode | LucideIcon;
  title: string;
  description?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  suggestions?: string[];
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions = [],
  compact = false,
  className = "",
}: EmptyStateProps) {
  const IconComponent = Icon as LucideIcon;

  return (
    <Card className={`${compact ? "p-6" : "p-12"} ${className}`}>
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Icon */}
        {Icon && (
          <div className={`rounded-full bg-muted p-4 ${compact ? "" : "mb-2"}`}>
            {typeof Icon === "function" ? (
              <IconComponent className={`${compact ? "h-8 w-8" : "h-12 w-12"} text-muted-foreground`} />
            ) : (
              Icon
            )}
          </div>
        )}

        {/* Title and Description */}
        <div className="space-y-2 max-w-md">
          <h3 className={`${compact ? "text-lg" : "text-xl"} font-semibold`}>{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-3 pt-2">
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                variant={primaryAction.variant || "default"}
                size={compact ? "sm" : "default"}
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || "outline"}
                size={compact ? "sm" : "default"}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="pt-4 border-t w-full max-w-md">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Suggestions:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-left">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

// Pre-built empty state variants for common scenarios
export function NoDataEmptyState({
  entityName = "items",
  onAction,
  actionLabel = "Add New",
}: {
  entityName?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">No {entityName} found</p>
        {onAction && (
          <Button onClick={onAction} variant="outline" size="sm">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3 max-w-md">
        <p className="text-muted-foreground">
          No results found for <span className="font-semibold">"{query}"</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
        {onClear && (
          <Button onClick={onClear} variant="outline" size="sm">
            Clear Search
          </Button>
        )}
      </div>
    </div>
  );
}

export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3 max-w-md">
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

