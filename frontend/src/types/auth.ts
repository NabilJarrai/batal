// Authentication related types matching backend DTOs

// Import UserResponse type
import type { UserResponse } from './users';

// Re-export UserResponse for convenience
export type { UserResponse } from './users';

// Login Request DTO (matches backend LoginRequest.java)
export interface LoginRequest {
  email: string;
  password: string;
}

// Register Request DTO (matches backend RegisterRequest.java)
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
}

// Child Summary DTO (for parent login response)
export interface ChildSummary {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  groupName?: string;
  level?: string;
  isActive: boolean;
}

// Login Response DTO (matches backend LoginResponse.java)
export interface LoginResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  token: string;
  type: string;
  firstLogin: boolean;
  children?: ChildSummary[]; // For parents only
}

// User roles enum (matches backend roles)
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  COACH = "COACH",
  PARENT = "PARENT", // Added PARENT, removed PLAYER
}

// Legacy types for backward compatibility
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  success: boolean;
}

// RTK Auth State
export interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isFirstLogin: boolean;
  children?: ChildSummary[]; // For parents
  selectedChildId?: number; // Currently selected child for parents
}
