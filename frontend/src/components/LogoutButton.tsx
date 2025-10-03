"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { logout } from "@/store/authSlice";

interface LogoutButtonProps {
  className?: string;
  variant?: 'default' | 'icon' | 'dropdown';
}

export default function LogoutButton({ 
  className = "",
  variant = 'default' 
}: LogoutButtonProps) {
  const router = useRouter();
  const { dispatch } = useAuth();

  const handleLogout = () => {
    // Dispatch logout action to clear Redux state and localStorage
    dispatch(logout());
    
    // Redirect to login page
    router.push('/login');
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        className={`btn-icon btn-ghost ${className}`}
        title="Logout"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <button
        onClick={handleLogout}
        className={`btn-ghost text-left w-full ${className}`}
      >
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={`btn-destructive btn-md ${className}`}
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  );
}