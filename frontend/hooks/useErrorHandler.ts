import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  parseError,
  getUserMessage,
  isRecoverableError,
  requiresAuth,
  logError,
  AppError,
} from "@/lib/error-handler";
import { authService } from "@/lib/auth";

export interface ErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  showRetry?: boolean;
  onRetry?: () => void | Promise<void>;
  redirectOnAuth?: boolean;
  customMessage?: string;
}

export interface ErrorHandlerReturn {
  error: AppError | null;
  isRetrying: boolean;
  handleError: (error: unknown, options?: ErrorHandlerOptions) => void;
  retry: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for consistent error handling across the application
 * 
 * @example
 * ```typescript
 * const { handleError, retry, isRetrying } = useErrorHandler();
 * 
 * const loadData = async () => {
 *   try {
 *     const data = await api.get('/data');
 *     setData(data);
 *   } catch (error) {
 *     handleError(error, {
 *       context: 'loading data',
 *       showRetry: true,
 *       onRetry: loadData,
 *     });
 *   }
 * };
 * ```
 */
export function useErrorHandler(): ErrorHandlerReturn {
  const { toast } = useToast();
  const router = useRouter();
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCallback, setRetryCallback] = useState<(() => void | Promise<void>) | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCallback(null);
  }, []);

  const retry = useCallback(async () => {
    if (!retryCallback) return;
    
    setIsRetrying(true);
    clearError();
    
    try {
      await retryCallback();
    } catch (error) {
      // If retry fails, handle it again
      handleError(error, { showRetry: true, onRetry: retryCallback });
    } finally {
      setIsRetrying(false);
    }
  }, [retryCallback, clearError]);

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        context,
        showToast = true,
        showRetry = false,
        onRetry,
        redirectOnAuth = true,
        customMessage,
      } = options;

      // Parse the error
      const appError = parseError(error, context);
      
      // Log the error for debugging
      logError(appError);
      
      // Store error state
      setError(appError);
      
      // Store retry callback if provided
      if (onRetry) {
        setRetryCallback(() => onRetry);
      }

      // Handle authentication errors
      if (requiresAuth(appError) && redirectOnAuth) {
        authService.logout();
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        return;
      }

      // Show toast notification
      if (showToast) {
        const message = customMessage || appError.userMessage;
        
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
          action: showRetry && isRecoverableError(appError) && onRetry ? {
            label: "Retry",
            onClick: retry,
          } as any : undefined,
        });
      }
    },
    [toast, router, retry]
  );

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError,
  };
}

/**
 * Wrapper for async functions with automatic error handling
 * 
 * @example
 * ```typescript
 * const { execute, loading, error } = useAsyncError(
 *   async () => {
 *     return await api.get('/data');
 *   },
 *   { context: 'loading data' }
 * );
 * 
 * // Call it
 * const data = await execute();
 * ```
 */
export function useAsyncError<T>(
  asyncFn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const { handleError, error, isRetrying, retry, clearError } = useErrorHandler();

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    clearError();
    
    try {
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error, {
        ...options,
        onRetry: async () => {
          await execute();
        },
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, handleError, options, clearError]);

  return {
    execute,
    loading,
    error,
    isRetrying,
    retry,
    clearError,
  };
}

