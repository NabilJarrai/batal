// Utility functions and configurations
// This file is a placeholder for utility functions

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/api";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Batal Academy";

// Utility function to format dates
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString();
};

// Utility function to handle API errors
export const handleApiError = (error: unknown): string => {
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
