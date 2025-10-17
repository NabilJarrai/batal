"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login"
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect while checking authentication status
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0 && user) {
      const hasPermission = user.roles?.some(role => 
        allowedRoles.includes(role)
      );

      if (!hasPermission) {
        // Redirect to appropriate dashboard based on user's actual role
        if (user.roles?.includes('ADMIN')) {
          router.push('/admin');
        } else if (user.roles?.includes('MANAGER')) {
          router.push('/manager');
        } else if (user.roles?.includes('COACH')) {
          router.push('/coach');
        } else {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children until we know user is authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role permissions if specified
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasPermission = user.roles?.some(role => 
      allowedRoles.includes(role)
    );
    
    if (!hasPermission) {
      return null;
    }
  }

  return <>{children}</>;
}