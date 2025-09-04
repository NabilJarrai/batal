"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const navigateToDashboard = (role: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/login');
      return;
    }

    // If authenticated, check if user has the correct role
    const userRoles = user?.roles || [];
    
    switch (role) {
      case 'admin':
        if (userRoles.includes('ADMIN')) {
          router.push('/admin');
        } else {
          router.push('/login');
        }
        break;
      case 'manager':
        if (userRoles.includes('MANAGER')) {
          router.push('/manager');
        } else {
          router.push('/login');
        }
        break;
      case 'coach':
        if (userRoles.includes('COACH')) {
          router.push('/coach');
        } else {
          router.push('/login');
        }
        break;
      default:
        router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">⚽</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Batal Football Academy
                </h1>
                <p className="text-blue-200 text-sm">
                  Excellence in Football Training
                </p>
              </div>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
              >
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Welcome to Batal Academy
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Comprehensive football academy management system for coaches, players, and administrators.
            Choose your role to access the appropriate dashboard.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Admin Card */}
          <div
            onClick={() => navigateToDashboard('admin')}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h3>
              <p className="text-blue-200 text-center mb-4">
                Full system control and management
              </p>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>✓ Manage Users & Coaches</li>
                <li>✓ Create Groups & Players</li>
                <li>✓ System Configuration</li>
                <li>✓ View All Reports</li>
              </ul>
              <button className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200">
                Access Admin Portal
              </button>
            </div>
          </div>

          {/* Manager Card */}
          <div
            onClick={() => navigateToDashboard('manager')}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a2 2 0 00-2-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Manager Dashboard</h3>
              <p className="text-blue-200 text-center mb-4">
                Academy oversight and analytics
              </p>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>✓ Academy Analytics</li>
                <li>✓ Financial Overview</li>
                <li>✓ Performance Reports</li>
                <li>✓ Strategic Planning</li>
              </ul>
              <button className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
                Access Manager Portal
              </button>
            </div>
          </div>

          {/* Coach Card */}
          <div
            onClick={() => navigateToDashboard('coach')}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Coach Dashboard</h3>
              <p className="text-blue-200 text-center mb-4">
                Group and player management
              </p>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>✓ Manage Assigned Groups</li>
                <li>✓ Track Player Progress</li>
                <li>✓ Schedule Training</li>
                <li>✓ Assessment Tools</li>
              </ul>
              <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                Access Coach Portal
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            System Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Group Management</h4>
              <p className="text-sm text-blue-200">
                Organize players by age and skill level
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Analytics</h4>
              <p className="text-sm text-blue-200">
                Track performance and progress
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Auto-Assignment</h4>
              <p className="text-sm text-blue-200">
                Smart player-to-group matching
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Promotions</h4>
              <p className="text-sm text-blue-200">
                Track and manage player advancement
              </p>
            </div>
          </div>
        </div>

        {/* Demo Access Section */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Quick Demo Access
          </h3>
          <p className="text-blue-200 mb-6">
            Login with demo credentials to test different dashboard roles
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigateToDashboard('admin')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Demo Admin
            </button>
            <button
              onClick={() => navigateToDashboard('manager')}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Demo Manager
            </button>
            <button
              onClick={() => navigateToDashboard('coach')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Demo Coach
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-blue-200">
            <p>© 2024 Batal Football Academy. All rights reserved.</p>
            <p className="text-sm mt-2">
              Comprehensive Academy Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}