// User management types matching backend DTOs

// Enums matching backend enums
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export enum UserType {
  COACH = "COACH",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  PARENT = "PARENT"
}

// Child Summary DTO (for parent views)
export interface ChildSummaryDTO {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  groupName?: string;
  level?: string;
  isActive: boolean;
}

// Enhanced User Response (matches backend UserResponse.java)
export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  userType?: UserType;
  title?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  inactiveReason?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  passwordSetAt?: string; // ISO datetime string - when user first set their password
  roles: string[];
  children?: ChildSummaryDTO[]; // For PARENT user type
}

// User Create Request (matches backend UserCreateRequest.java)
// Password removed - users set password via email link
export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  userType?: UserType;
  title?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
}

// User Update Request (matches backend UserUpdateRequest.java) 
export interface UserUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  userType?: UserType;
  title?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
}

// User Status Update Request (matches backend UserStatusUpdateRequest.java)
export interface UserStatusUpdateRequest {
  isActive: boolean;
  inactiveReason?: string;
}

// Coach-specific types
export type CoachResponse = UserResponse & {
  userType: UserType.COACH;
  // Additional coach-specific fields can be added here when needed
};

// Helper utility types
export interface UserFormData extends Omit<UserCreateRequest, 'password'> {
  password?: string; // Optional for updates
  confirmPassword?: string;
}

export interface UserFilters {
  isActive?: boolean;
  userType?: UserType;
  searchTerm?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  coaches: number;
  admins: number;
  managers: number;
  parents: number;
}