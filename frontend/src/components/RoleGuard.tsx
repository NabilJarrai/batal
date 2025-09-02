// Role-based access control components
import React from "react";
import { usePermission, useRole } from "@/hooks/useRBAC";
import { Permission } from "@/lib/rbac";
import { UserRole } from "@/types/auth";

// Component that renders children only if user has required permission
interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const hasRequiredPermission = usePermission(permission);

  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
};

// Component that renders children only if user has one of the required roles
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const hasRequiredRole = useRole(allowedRoles);

  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for role-based page protection
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  fallbackComponent?: React.ComponentType
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const hasRequiredRole = useRole(allowedRoles);

    if (!hasRequiredRole) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Access Denied
            </h2>
            <p className="text-blue-200 mb-6">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-blue-300">
              Required roles: {allowedRoles.join(", ")}
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withRoleGuard(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};
