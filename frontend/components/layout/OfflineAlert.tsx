"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OfflineAlert() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide reconnected message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and haven't recently reconnected
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-screen-xl mx-auto">
        {!isOnline ? (
          <Alert variant="destructive" className="shadow-lg animate-in slide-in-from-top">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="font-medium">
              No internet connection. Some features may not be available.
            </AlertDescription>
          </Alert>
        ) : showReconnected ? (
          <Alert className="shadow-lg bg-green-50 text-green-900 border-green-200 dark:bg-green-950/30 dark:text-green-100 dark:border-green-800 animate-in slide-in-from-top">
            <Wifi className="h-4 w-4" />
            <AlertDescription className="font-medium">
              Back online! All features are now available.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Hook to detect online/offline status
 * 
 * @example
 * ```typescript
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <p>Please check your internet connection</p>;
 * }
 * ```
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

