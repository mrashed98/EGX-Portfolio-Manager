"use client";

import { HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface ContextualHelpProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  variant?: "icon" | "inline";
  size?: "sm" | "md" | "lg";
}

export function ContextualHelp({
  content,
  side = "top",
  variant = "icon",
  size = "sm",
}: ContextualHelpProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";

  if (variant === "inline") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-primary"
            >
              <Info className={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-xs">
            <p className="text-sm">{content}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpSectionProps {
  title: string;
  description: string;
  learnMoreUrl?: string;
  children: React.ReactNode;
}

export function HelpSection({ title, description, learnMoreUrl, children }: HelpSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <ContextualHelp content={description} />
      </div>
      {children}
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Learn more →
        </a>
      )}
    </div>
  );
}

