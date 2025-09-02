// RBAC hooks for React components
import { useAuth } from "@/store/hooks";
import {
  hasPermission,
  hasRole,
  getHighestRole,
  canAccessRoute,
  Permission,
} from "@/lib/rbac";
import { UserRole } from "@/types/auth";

// Hook to check permissions
export const usePermission = (permission: Permission): boolean => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  return hasPermission(userRoles, permission);
};

// Hook to check roles
export const useRole = (allowedRoles: UserRole[]): boolean => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  return hasRole(userRoles, allowedRoles);
};

// Hook to get user's highest role
export const useHighestRole = (): UserRole | null => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  return getHighestRole(userRoles);
};

// Hook to check route access
export const useRouteAccess = (route: string): boolean => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  return canAccessRoute(userRoles, route);
};

// Hook to get all user permissions (useful for debugging)
export const useUserPermissions = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const permissions = {
    canManageUsers: hasPermission(userRoles, "canManageUsers"),
    canManageCoaches: hasPermission(userRoles, "canManageCoaches"),
    canManagePlayers: hasPermission(userRoles, "canManagePlayers"),
    canViewReports: hasPermission(userRoles, "canViewReports"),
    canManageSchedule: hasPermission(userRoles, "canManageSchedule"),
    canManageSystem: hasPermission(userRoles, "canManageSystem"),
    canViewFinances: hasPermission(userRoles, "canViewFinances"),
    canManageRoles: hasPermission(userRoles, "canManageRoles"),
  };

  return {
    ...permissions,
    roles: userRoles,
    highestRole: getHighestRole(userRoles),
  };
};
