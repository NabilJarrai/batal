// This file is a placeholder for TypeScript type definitions
// Types will be added as the application is developed

export interface User {
  id: string;
  name: string;
  email: string;
  role: "PLAYER" | "COACH" | "ADMIN" | "MANAGER";
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
