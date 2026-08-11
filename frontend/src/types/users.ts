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
  // The family's second guardian, for PARENT accounts. Contact only - no
  // account exists for them, so email and phone are optional.
  secondaryParentName?: string;
  secondaryParentEmail?: string;
  secondaryParentPhone?: string;
  title?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  inactiveReason?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  passwordSetAt?: string; // ISO datetime string - when user first set their password
  // Undefined means this person has never been sent their setup link - either
  // the account was created while welcome emails were paused, or every send so
  // far failed. Either way they are still waiting to be invited.
  welcomeEmailSentAt?: string; // ISO datetime string
  roles: string[];
  children?: ChildSummaryDTO[]; // For PARENT user type
}

// Where a parent sits in onboarding. Derived from the two timestamps above
// rather than stored, so it cannot drift out of step with them.
export type ParentInviteStatus = "not_invited" | "invited" | "active";

export function getParentInviteStatus(user: UserResponse): ParentInviteStatus {
  if (user.passwordSetAt) return "active";
  if (user.welcomeEmailSentAt) return "invited";
  return "not_invited";
}

// Bulk welcome email send (matches backend BulkWelcomeEmailResponse.java).
// queuedCount is work accepted, not mail delivered - sending happens in the
// background, and progress shows up as parents flip to "invited" in the list.
export interface BulkWelcomeEmailResponse {
  queuedCount: number;
  skipped: {
    userId: number;
    name: string;
    reason: string;
  }[];
}

// Parent welcome email switch (matches backend ParentWelcomeEmailSettingResponse.java)
export interface ParentWelcomeEmailSetting {
  enabled: boolean;
  awaitingWelcomeEmailCount: number;
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
  // The family's second guardian, for PARENT accounts. Contact only - no
  // account exists for them, so email and phone are optional.
  secondaryParentName?: string;
  secondaryParentEmail?: string;
  secondaryParentPhone?: string;
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
  // The family's second guardian, for PARENT accounts. Contact only - no
  // account exists for them, so email and phone are optional.
  secondaryParentName?: string;
  secondaryParentEmail?: string;
  secondaryParentPhone?: string;
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