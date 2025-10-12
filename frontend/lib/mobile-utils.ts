/**
 * Mobile Utilities
 * Helper functions and hooks for mobile optimization
 */

import { useEffect, useState } from "react";

/**
 * Detect if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Hook to detect mobile device
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): "portrait" | "landscape" {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation("portrait");
      } else {
        setOrientation("landscape");
      }
    };

    handleOrientationChange();
    window.addEventListener("resize", handleOrientationChange);
    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  return orientation;
}

/**
 * Hook to detect safe area insets (for notched devices)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue("--sat") || "0"),
        right: parseInt(style.getPropertyValue("--sar") || "0"),
        bottom: parseInt(style.getPropertyValue("--sab") || "0"),
        left: parseInt(style.getPropertyValue("--sal") || "0"),
      });
    };

    updateInsets();
    window.addEventListener("resize", updateInsets);
    return () => window.removeEventListener("resize", updateInsets);
  }, []);

  return insets;
}

/**
 * Ensure minimum touch target size (44x44px)
 */
export const TOUCH_TARGET_SIZE = 44; // in pixels

export function getTouchTargetClasses(): string {
  return "min-h-[44px] min-w-[44px] flex items-center justify-center";
}

/**
 * Prevent double-tap zoom on specific elements
 */
export function preventDoubleTapZoom(element: HTMLElement) {
  let lastTap = 0;
  
  element.addEventListener("touchend", (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
    }
    
    lastTap = currentTime;
  });
}

/**
 * Enable momentum scrolling on iOS
 */
export function enableMomentumScrolling(element: HTMLElement) {
  (element.style as any).webkitOverflowScrolling = "touch";
  element.style.overflowY = "auto";
}

/**
 * Haptic feedback (vibration) for touch interactions
 */
export function hapticFeedback(type: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return;

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 40,
  };

  navigator.vibrate(patterns[type]);
}

/**
 * Lock orientation (requires Fullscreen API)
 */
export async function lockOrientation(
  orientation: "portrait" | "landscape"
): Promise<boolean> {
  if (!("orientation" in screen)) return false;

  try {
    // @ts-ignore
    await screen.orientation.lock(orientation);
    return true;
  } catch (error) {
    console.warn("Orientation lock failed:", error);
    return false;
  }
}

/**
 * Unlock orientation
 */
export function unlockOrientation(): void {
  if ("orientation" in screen) {
    // @ts-ignore
    screen.orientation.unlock();
  }
}

/**
 * Share API (for native share on mobile)
 */
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!("share" in navigator)) {
    console.warn("Web Share API not supported");
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User canceled sharing
      return false;
    }
    console.error("Share failed:", error);
    return false;
  }
}

/**
 * Copy to clipboard (mobile-friendly)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error("Copy failed:", error);
    return false;
  }
}

/**
 * Request fullscreen (useful for charts and detailed views)
 */
export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
  const el = element || document.documentElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      await (el as any).webkitRequestFullscreen();
    } else if ((el as any).msRequestFullscreen) {
      await (el as any).msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error("Fullscreen request failed:", error);
    return false;
  }
}

/**
 * Exit fullscreen
 */
export async function exitFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error("Exit fullscreen failed:", error);
    return false;
  }
}

/**
 * Prevent scroll on body (useful for modals on mobile)
 */
export function preventBodyScroll(prevent: boolean) {
  if (prevent) {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
  } else {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }
}

/**
 * Get viewport height accounting for mobile address bar
 */
export function getViewportHeight(): number {
  return window.visualViewport?.height || window.innerHeight;
}

/**
 * Hook for viewport height that updates on resize
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(
    typeof window !== "undefined" ? getViewportHeight() : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setHeight(getViewportHeight());
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return height;
}

