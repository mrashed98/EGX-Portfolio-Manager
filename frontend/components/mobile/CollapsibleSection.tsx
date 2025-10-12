"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  icon,
  className = "",
  contentClassName = "",
  onToggle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <Card className={className}>
      <CardHeader
        className="cursor-pointer select-none py-4 px-4 md:px-6"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <CardTitle className="text-base md:text-lg truncate">{title}</CardTitle>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
          <div className="flex-shrink-0 ml-2">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className={`px-4 pb-4 md:px-6 md:pb-6 ${contentClassName}`}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Accordion-style collapsible sections (only one open at a time)
 */
interface CollapsibleAccordionProps {
  sections: Array<{
    id: string;
    title: string;
    content: ReactNode;
    badge?: ReactNode;
    icon?: ReactNode;
  }>;
  defaultOpenId?: string;
  className?: string;
}

export function CollapsibleAccordion({
  sections,
  defaultOpenId,
  className = "",
}: CollapsibleAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null);

  return (
    <div className={`space-y-3 ${className}`}>
      {sections.map((section) => (
        <CollapsibleSection
          key={section.id}
          title={section.title}
          badge={section.badge}
          icon={section.icon}
          defaultOpen={section.id === openId}
          onToggle={(isOpen) => {
            if (isOpen) {
              setOpenId(section.id);
            } else if (openId === section.id) {
              setOpenId(null);
            }
          }}
        >
          {section.content}
        </CollapsibleSection>
      ))}
    </div>
  );
}

/**
 * Mobile-optimized sticky section header
 */
interface StickyHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function StickyHeader({
  title,
  subtitle,
  actions,
  className = "",
}: StickyHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b ${className}`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Swipeable card with actions
 */
interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { label: string; icon?: ReactNode; color?: string };
  rightAction?: { label: string; icon?: ReactNode; color?: string };
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = "",
}: SwipeableCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    setCurrentX(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const threshold = 80;
    
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setCurrentX(0);
    setStartX(0);
  };

  const translateX = Math.max(-150, Math.min(150, currentX));

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      {rightAction && translateX > 0 && (
        <div
          className={`absolute left-0 top-0 bottom-0 flex items-center px-4 ${
            rightAction.color || "bg-blue-500"
          }`}
          style={{ width: `${translateX}px` }}
        >
          {rightAction.icon}
          {translateX > 60 && (
            <span className="ml-2 text-white text-sm font-medium">
              {rightAction.label}
            </span>
          )}
        </div>
      )}
      
      {leftAction && translateX < 0 && (
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-center justify-end px-4 ${
            leftAction.color || "bg-red-500"
          }`}
          style={{ width: `${Math.abs(translateX)}px` }}
        >
          {Math.abs(translateX) > 60 && (
            <span className="mr-2 text-white text-sm font-medium">
              {leftAction.label}
            </span>
          )}
          {leftAction.icon}
        </div>
      )}

      {/* Card Content */}
      <div
        className={`md:hidden ${className}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Desktop fallback (no swipe) */}
      <div className="hidden md:block">{children}</div>
    </div>
  );
}

