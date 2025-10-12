/**
 * Error Handler Utilities
 * Centralized error handling with user-friendly messages
 */

import { AxiosError } from "axios";

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  context?: string;
  details?: any;
  timestamp: Date;
}

/**
 * Error codes for different scenarios
 */
export const ERROR_CODES = {
  // Network Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  OFFLINE: "OFFLINE",
  
  // Authentication Errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  
  // Validation Errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  
  // Resource Errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  
  // Server Errors
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  
  // Business Logic Errors
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  STOCK_NOT_AVAILABLE: "STOCK_NOT_AVAILABLE",
  INVALID_OPERATION: "INVALID_OPERATION",
  
  // Unknown
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: "Unable to connect to the server. Please check your internet connection.",
  [ERROR_CODES.TIMEOUT]: "The request took too long to complete. Please try again.",
  [ERROR_CODES.OFFLINE]: "You appear to be offline. Please check your internet connection.",
  
  [ERROR_CODES.UNAUTHORIZED]: "You need to log in to access this feature.",
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to perform this action.",
  [ERROR_CODES.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
  
  [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
  [ERROR_CODES.INVALID_INPUT]: "Some of the information you provided is invalid.",
  
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
  [ERROR_CODES.ALREADY_EXISTS]: "This item already exists.",
  
  [ERROR_CODES.SERVER_ERROR]: "An unexpected error occurred. Our team has been notified.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again later.",
  
  [ERROR_CODES.INSUFFICIENT_FUNDS]: "Insufficient funds to complete this operation.",
  [ERROR_CODES.STOCK_NOT_AVAILABLE]: "This stock is not available for trading.",
  [ERROR_CODES.INVALID_OPERATION]: "This operation cannot be completed at this time.",
  
  [ERROR_CODES.UNKNOWN]: "An unexpected error occurred. Please try again.",
};

/**
 * Parse an error into a structured AppError
 */
export function parseError(error: unknown, context?: string): AppError {
  const timestamp = new Date();
  
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Network errors
    if (!error.response) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: error.message,
        userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
        context,
        timestamp,
      };
    }
    
    // Map HTTP status codes to error codes
    let errorCode: string = ERROR_CODES.UNKNOWN;
    
    if (status === 401) errorCode = ERROR_CODES.UNAUTHORIZED;
    else if (status === 403) errorCode = ERROR_CODES.FORBIDDEN;
    else if (status === 404) errorCode = ERROR_CODES.NOT_FOUND;
    else if (status === 409) errorCode = ERROR_CODES.ALREADY_EXISTS;
    else if (status === 422) errorCode = ERROR_CODES.VALIDATION_ERROR;
    else if (status === 503) errorCode = ERROR_CODES.SERVICE_UNAVAILABLE;
    else if (status && status >= 500) errorCode = ERROR_CODES.SERVER_ERROR;
    
    // Use backend error message if available
    const userMessage = data?.detail || data?.message || ERROR_MESSAGES[errorCode];
    
    return {
      code: errorCode,
      message: error.message,
      userMessage,
      context,
      details: data,
      timestamp,
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN,
      message: error.message,
      userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
      context,
      timestamp,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: ERROR_CODES.UNKNOWN,
      message: error,
      userMessage: error,
      context,
      timestamp,
    };
  }
  
  // Unknown error type
  return {
    code: ERROR_CODES.UNKNOWN,
    message: 'An unknown error occurred',
    userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN],
    context,
    details: error,
    timestamp,
  };
}

/**
 * Get a user-friendly error message
 */
export function getUserMessage(error: unknown, context?: string): string {
  const appError = parseError(error, context);
  
  if (context) {
    return `Error ${context}: ${appError.userMessage}`;
  }
  
  return appError.userMessage;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: AppError): boolean {
  const recoverableCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVICE_UNAVAILABLE,
  ];
  
  return recoverableCodes.includes(error.code as any);
}

/**
 * Check if error requires authentication
 */
export function requiresAuth(error: AppError): boolean {
  return error.code === ERROR_CODES.UNAUTHORIZED ||
         error.code === ERROR_CODES.SESSION_EXPIRED;
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logError(error: AppError) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error [${error.code}]`);
    console.error('User Message:', error.userMessage);
    console.error('Technical Message:', error.message);
    if (error.context) console.error('Context:', error.context);
    if (error.details) console.error('Details:', error.details);
    console.error('Timestamp:', error.timestamp.toISOString());
    console.groupEnd();
  }
  
  // In production, send to error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Format validation errors from backend
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}

