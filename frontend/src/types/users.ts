// User management types matching backend DTOs

// Enums matching backend enums
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export enum UserType {
  COACH = "COACH",
  ADMIN = "ADMIN", 
  MANAGER = "MANAGER"
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
  joiningDate?: string; // ISO date string
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  roles: string[];
}

// User Create Request (matches backend UserCreateRequest.java)
export interface UserCreateRequest {
  email: string;
  password: string;
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
export interface CoachResponse extends UserResponse {
  userType: UserType.COACH;
  // Additional coach-specific fields can be added here
}

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
}