import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

/**
 * Custom hook for managing keyboard shortcuts
 * 
 * @example
 * ```typescript
 * useKeyboardShortcuts([
 *   {
 *     key: "k",
 *     ctrl: true,
 *     action: () => openCommandPalette(),
 *     description: "Open command palette"
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook for application-wide global shortcuts
 */
export function useGlobalShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      ctrl: true,
      action: () => {
        // Command palette - could be implemented later
        console.log("Command palette - coming soon!");
      },
      description: "Open command palette",
    },
    {
      key: "n",
      ctrl: true,
      action: () => router.push("/dashboard/portfolios?action=new"),
      description: "New portfolio",
    },
    {
      key: "s",
      ctrl: true,
      action: () => router.push("/dashboard/strategies?action=new"),
      description: "New strategy",
    },
    {
      key: "h",
      ctrl: true,
      action: () => router.push("/dashboard/holdings"),
      description: "Go to holdings",
    },
    {
      key: "/",
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        searchInput?.focus();
      },
      description: "Focus search",
    },
    {
      key: "1",
      ctrl: true,
      action: () => router.push("/dashboard"),
      description: "Go to Analytics",
    },
    {
      key: "2",
      ctrl: true,
      action: () => router.push("/dashboard/stocks"),
      description: "Go to Stocks",
    },
    {
      key: "3",
      ctrl: true,
      action: () => router.push("/dashboard/portfolios"),
      description: "Go to Portfolios",
    },
    {
      key: "4",
      ctrl: true,
      action: () => router.push("/dashboard/strategies"),
      description: "Go to Strategies",
    },
    {
      key: "5",
      ctrl: true,
      action: () => router.push("/dashboard/holdings"),
      description: "Go to Holdings",
    },
    {
      key: ",",
      ctrl: true,
      action: () => router.push("/dashboard/settings"),
      description: "Open settings",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Detect OS for proper modifier key display
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  if (shortcut.ctrl) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.meta) {
    parts.push(isMac ? "⌘" : "Win");
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
}

/**
 * Hook for list/table keyboard navigation
 */
export function useListNavigation<T>(items: T[], onSelect: (item: T) => void) {
  useEffect(() => {
    let selectedIndex = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (items.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          break;
        case "Enter":
          event.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex]);
          }
          break;
        case "Home":
          event.preventDefault();
          selectedIndex = 0;
          break;
        case "End":
          event.preventDefault();
          selectedIndex = items.length - 1;
          break;
      }

      // Highlight selected item (add class or style)
      const listItems = document.querySelectorAll('[role="listitem"]');
      listItems.forEach((item, index) => {
        if (index === selectedIndex) {
          item.classList.add("keyboard-selected");
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.classList.remove("keyboard-selected");
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, onSelect]);
}

/**
 * Escape key handler
 */
export function useEscapeKey(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback]);
}

