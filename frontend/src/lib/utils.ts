// Utility functions and configurations
// This file is a placeholder for utility functions

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Batal Academy";

// Utility function to format dates
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString();
};

// Enhanced date formatting with error handling
export const formatDateSafe = (date: Date | string | null | undefined): string => {
  try {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  } catch (error) {
    logError(error, 'formatDateSafe');
    return 'Invalid Date';
  }
};

// Enhanced error logging utility
interface LoggableError extends Error {
  status?: number;
  type?: string;
  details?: any;
  timestamp?: string;
}

// Error logging function
export const logError = (error: unknown, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorObj = error as LoggableError;

  const logData = {
    timestamp,
    context: context || 'Unknown',
    message: errorObj.message || 'Unknown error',
    status: errorObj.status,
    type: errorObj.type,
    details: errorObj.details,
    stack: errorObj.stack
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Log');
    console.error('Context:', logData.context);
    console.error('Message:', logData.message);
    if (logData.status) console.error('Status:', logData.status);
    if (logData.type) console.error('Type:', logData.type);
    if (logData.details) console.error('Details:', logData.details);
    if (logData.stack) console.error('Stack:', logData.stack);
    console.groupEnd();
  }

  // In production, you could send to error reporting service
  // Example: sendToErrorReporting(logData);

  return logData;
};

// Utility function to handle API errors (enhanced)
export const handleApiError = (error: unknown, context?: string): string => {
  // Log the error
  logError(error, context);

  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
  }
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred";
};

// Utility to get user-friendly error message based on error type
export const getUserFriendlyErrorMessage = (error: unknown): {
  message: string;
  type: string;
  canRetry: boolean;
  suggestion: string;
} => {
  const errorObj = error as LoggableError;
  const errorType = errorObj.type || 'UNKNOWN';
  const status = errorObj.status || 0;

  let message = errorObj.message || 'An unexpected error occurred';
  let canRetry = true;
  let suggestion = '';

  switch (errorType) {
    case 'AUTHENTICATION':
      message = status === 401 ? 'Invalid email or password' : message;
      suggestion = 'Please double-check your credentials and try again.';
      break;
    case 'NETWORK':
      message = 'Network connection failed';
      suggestion = 'Check your internet connection and try again.';
      break;
    case 'SERVER':
      message = 'Server temporarily unavailable';
      suggestion = 'Please try again in a few minutes.';
      break;
    case 'VALIDATION':
      canRetry = false;
      suggestion = 'Please fix the highlighted fields above.';
      break;
    default:
      suggestion = 'Please try again or contact support if the problem persists.';
  }

  return { message, type: errorType, canRetry, suggestion };
};
