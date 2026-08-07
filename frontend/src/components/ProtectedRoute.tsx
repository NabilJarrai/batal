"use client";

import { useEffect, useRef } from "react";
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
  const { isAuthenticated, user, isLoading, isInitialized } = useAuth();

  /**
   * Once the page has been shown to an authenticated user, keep it mounted.
   *
   * This guard used to return a spinner whenever isLoading went true, which
   * unmounts everything below it. Any later auth activity therefore destroyed
   * the page's state - the admin dashboard would snap back to the Overview tab
   * mid-task, because its selected tab lives in component state.
   *
   * A ref rather than state: it must not itself trigger a render, and it is
   * only ever read during render.
   */
  const hasShownContent = useRef(false);

  const hasPermission =
    !allowedRoles || allowedRoles.length === 0
      ? true
      : Boolean(user?.roles?.some(role => allowedRoles.includes(role)));

  // Comparing contents, not identity: callers pass an inline array literal, so
  // a new reference arrives on every render and would re-run this effect (and
  // its router.push calls) constantly.
  const allowedRolesKey = allowedRoles ? allowedRoles.join(",") : "";

  useEffect(() => {
    // Wait for the stored token to be checked. Redirecting before that would
    // bounce a signed-in user to the login page on every hard refresh, because
    // isAuthenticated starts false and says nothing until auth resolves.
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (!hasPermission && user) {
      if (user.roles?.includes('ADMIN')) {
        router.push('/admin');
      } else if (user.roles?.includes('MANAGER')) {
        router.push('/manager');
      } else if (user.roles?.includes('COACH')) {
        router.push('/coach');
      } else if (user.roles?.includes('PARENT')) {
        router.push('/parent/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, hasPermission, user, allowedRolesKey, redirectTo, router]);

  const canShowContent = isAuthenticated && hasPermission;

  if (canShowContent) {
    hasShownContent.current = true;
    return <>{children}</>;
  }

  // Already showing the page: hold it rather than tearing it down over a
  // transient auth refresh. A genuine sign-out redirects, which unmounts it
  // anyway.
  if (hasShownContent.current && (isLoading || !isInitialized)) {
    return <>{children}</>;
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-primary">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, or lacking the role: the effect above is redirecting.
  return null;
}
