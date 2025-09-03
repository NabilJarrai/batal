// Main type definitions export file
// Re-exports all type definitions for easy importing

// User management types
export * from './users';
export * from './auth';

// Player management types  
export * from './players';

// Group management types
export * from './groups';

// Assignment system types
export * from './assignments';

// Common API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  status?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

// Form and UI types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  success: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  totalGroups: number;
  totalCoaches: number;
  recentActivity: any[];
}

// Search and filtering types
export interface SearchFilters {
  query?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Modal states
export interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  error?: string;
}

// Legacy types for backward compatibility
export interface User {
  id: string;
  name: string;
  email: string;
  role: "PLAYER" | "COACH" | "ADMIN" | "MANAGER";
}
