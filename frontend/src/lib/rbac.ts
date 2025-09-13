// Role-based access control utilities and hooks

import { UserRole } from "@/types/auth";

// Define permissions for each role
export const rolePermissions = {
  [UserRole.ADMIN]: {
    // Admin has all permissions
    canManageUsers: true,
    canManageCoaches: true,
    canManagePlayers: true,
    canViewReports: true,
    canManageSchedule: true,
    canManageSystem: true,
    canViewFinances: true,
    canManageRoles: true,
  },
  [UserRole.MANAGER]: {
    // Manager has most permissions except system management
    canManageUsers: false,
    canManageCoaches: true,
    canManagePlayers: true,
    canViewReports: true,
    canManageSchedule: true,
    canManageSystem: false,
    canViewFinances: true,
    canManageRoles: false,
  },
  [UserRole.COACH]: {
    // Coach has limited permissions
    canManageUsers: false,
    canManageCoaches: false,
    canManagePlayers: true, // Only their assigned players
    canViewReports: false,
    canManageSchedule: false,
    canManageSystem: false,
    canViewFinances: false,
    canManageRoles: false,
  },
  [UserRole.PLAYER]: {
    // Player has minimal permissions
    canManageUsers: false,
    canManageCoaches: false,
    canManagePlayers: false,
    canViewReports: false,
    canManageSchedule: false,
    canManageSystem: false,
    canViewFinances: false,
    canManageRoles: false,
  },
} as const;

// Type for permission keys
export type Permission = keyof (typeof rolePermissions)[UserRole.ADMIN];

// Helper function to check if user has specific permission
export const hasPermission = (
  userRoles: string[],
  permission: Permission
): boolean => {
  if (!userRoles || userRoles.length === 0) return false;

  // Check if any of the user's roles has this permission
  return userRoles.some((role) => {
    const roleKey = role as UserRole;
    return rolePermissions[roleKey]?.[permission] || false;
  });
};

// Helper function to check if user has any of the specified roles
export const hasRole = (
  userRoles: string[],
  allowedRoles: UserRole[] | string[]
): boolean => {
  if (!userRoles || userRoles.length === 0) return false;

  // Convert enum values to strings for comparison
  const allowedRoleStrings = allowedRoles.map(role => 
    typeof role === 'string' ? role : String(role)
  );
  
  return userRoles.some((role) => allowedRoleStrings.includes(role));
};

// Helper function to get the highest role (for display purposes)
export const getHighestRole = (userRoles: string[]): UserRole | null => {
  if (!userRoles || userRoles.length === 0) return null;

  // Order of role hierarchy (highest to lowest)
  const roleHierarchy = [UserRole.ADMIN, UserRole.MANAGER, UserRole.COACH, UserRole.PLAYER];

  for (const role of roleHierarchy) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return null;
};

// Route access control - define which roles can access which routes
export const routeAccess = {
  "/": ["ADMIN", "MANAGER", "COACH", "PLAYER"], // Landing page - all authenticated users
  "/users": ["ADMIN"], // User management - admin only
  "/coaches": ["ADMIN", "MANAGER"], // Coach management - admin and manager
  "/players": ["ADMIN", "MANAGER", "COACH"], // Player management - all roles
  "/schedule": ["ADMIN", "MANAGER"], // Schedule management - admin and manager
  "/reports": ["ADMIN", "MANAGER"], // Reports - admin and manager
  "/finances": ["ADMIN", "MANAGER"], // Finances - admin and manager
  "/system": ["ADMIN"], // System settings - admin only
  "/player": ["PLAYER"], // Player area - players only
  "/player/dashboard": ["PLAYER"], // Player dashboard - players only
  "/player/assessments": ["PLAYER"], // Player assessments - players only
  "/player/progress": ["PLAYER"], // Player progress - players only
  "/player/profile": ["PLAYER"], // Player profile - players only
} as const;

// Helper function to check route access
export const canAccessRoute = (userRoles: string[], route: string): boolean => {
  const allowedRoles = routeAccess[route as keyof typeof routeAccess];
  if (!allowedRoles) return false; // Route not defined, deny access

  return hasRole(userRoles, [...allowedRoles] as UserRole[]);
};
