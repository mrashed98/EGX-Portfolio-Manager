"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  threshold?: number; // Pixels to pull before triggering
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    
    // Only start if we're at the top of the scroll
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || disabled || refreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    // Apply resistance to the pull
    const resistedDistance = distance * 0.5;
    setPullDistance(Math.min(resistedDistance, threshold * 1.5));
  };

  const handleTouchEnd = async () => {
    if (!pulling || disabled) return;

    setPulling(false);

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Animate pull distance to 0 when not pulling
  useEffect(() => {
    if (!pulling && !refreshing && pullDistance > 0) {
      const animation = setInterval(() => {
        setPullDistance((prev) => {
          const newDistance = prev - 5;
          if (newDistance <= 0) {
            clearInterval(animation);
            return 0;
          }
          return newDistance;
        });
      }, 16);

      return () => clearInterval(animation);
    }
  }, [pulling, refreshing, pullDistance]);

  const rotation = refreshing ? 360 : (pullDistance / threshold) * 180;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center transition-opacity"
        style={{
          height: `${pullDistance}px`,
          opacity,
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 ${
            refreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: refreshing ? "none" : "transform 0.2s ease-out",
          }}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: pulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Hook for programmatic refresh
 * 
 * @example
 * ```typescript
 * const { refresh, isRefreshing } = useRefresh();
 * 
 * const handleRefresh = async () => {
 *   await refresh(async () => {
 *     await loadData();
 *   });
 * };
 * ```
 */
export function useRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async (fn: () => Promise<void>) => {
    setIsRefreshing(true);
    try {
      await fn();
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
}

