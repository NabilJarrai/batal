// Authentication related types matching backend DTOs

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

// Login Response DTO (matches backend LoginResponse.java)
export interface LoginResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  token: string;
}

// User Response DTO (matches backend UserResponse.java)
export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
}

// User roles enum (matches backend roles)
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  COACH = "COACH",
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
  user: LoginResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
