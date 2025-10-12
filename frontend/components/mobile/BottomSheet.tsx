"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  snapPoints?: number[]; // Percentage heights, e.g., [0.3, 0.6, 0.9]
  defaultSnap?: number; // Index of default snap point
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  snapPoints = [0.6, 0.9],
  defaultSnap = 0,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = currentY - startY;
    const threshold = 50;

    if (diff > threshold) {
      // Swipe down
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onOpenChange(false);
      }
    } else if (diff < -threshold) {
      // Swipe up
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    }

    setStartY(0);
    setCurrentY(0);
  };

  if (!open) return null;

  const heightPercentage = snapPoints[currentSnap] * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl z-50 md:hidden transition-all duration-300"
        style={{ height: `${heightPercentage}vh` }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && <h2 className="text-xl font-semibold">{title}</h2>}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 80px)" }}>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

