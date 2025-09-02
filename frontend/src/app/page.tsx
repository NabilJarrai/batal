"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { logout, initializeAuth } from "@/store/authSlice";
import { PermissionGuard, RoleGuard } from "@/components/RoleGuard";
import { useUserPermissions, useHighestRole } from "@/hooks/useRBAC";
import { UserRole } from "@/types/auth";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, dispatch } = useAuth();
  const router = useRouter();
  const userPermissions = useUserPermissions();
  const highestRole = useHighestRole();

  // Initialize auth on page load
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Batal Academy Dashboard
              </h1>
              <p className="text-blue-200 text-sm">
                Role: {highestRole || "Unknown"} | Permissions:{" "}
                {Object.values(userPermissions).filter(Boolean).length} active
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-200">
                Welcome, {user?.fullName || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              User Information
            </h2>
            <div className="space-y-2 text-blue-200">
              <p>
                <strong>Name:</strong> {user?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phoneNumber}
              </p>
              <p>
                <strong>Roles:</strong> {user?.roles?.join(", ")}
              </p>
              <p>
                <strong>ID:</strong> {user?.id}
              </p>
              <p>
                <strong>Highest Role:</strong> {highestRole}
              </p>
            </div>
          </div>

          {/* Role-Based Quick Actions Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {/* Player Management - All roles can access */}
              <PermissionGuard permission="canManagePlayers">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  Manage Players
                </button>
              </PermissionGuard>

              {/* Coach Management - Admin and Manager only */}
              <PermissionGuard permission="canManageCoaches">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  Manage Coaches
                </button>
              </PermissionGuard>

              {/* Schedule Management - Admin and Manager only */}
              <PermissionGuard permission="canManageSchedule">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  Schedule Management
                </button>
              </PermissionGuard>

              {/* Reports - Admin and Manager only */}
              <PermissionGuard permission="canViewReports">
                <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  View Reports
                </button>
              </PermissionGuard>

              {/* User Management - Admin only */}
              <PermissionGuard permission="canManageUsers">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  User Management
                </button>
              </PermissionGuard>

              {/* System Settings - Admin only */}
              <PermissionGuard permission="canManageSystem">
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  System Settings
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Permissions Summary Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Permissions
            </h2>
            <div className="space-y-2 text-sm">
              {Object.entries(userPermissions).map(
                ([permission, hasPermission]) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        hasPermission ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <span
                      className={
                        hasPermission ? "text-green-200" : "text-red-200"
                      }
                    >
                      {permission
                        .replace("can", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Admin-Only System Status Card */}
          <RoleGuard allowedRoles={[UserRole.ADMIN]}>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                System Status (Admin Only)
              </h2>
              <div className="space-y-2 text-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Authentication: Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Database: Connected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>API: Operational</span>
                </div>
              </div>
            </div>
          </RoleGuard>

          {/* Manager/Admin Financial Summary */}
          <PermissionGuard permission="canViewFinances">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                Financial Summary
              </h2>
              <div className="space-y-2 text-blue-200">
                <p>
                  <strong>Monthly Revenue:</strong> $12,500
                </p>
                <p>
                  <strong>Active Memberships:</strong> 45
                </p>
                <p>
                  <strong>Pending Payments:</strong> 3
                </p>
                <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  View Full Report
                </button>
              </div>
            </div>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}
