"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/hooks";
import { initializeAuth, markAuthInitialized } from "@/store/authSlice";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { dispatch } = useAuth();

  useEffect(() => {
    // Check for existing token in localStorage on app mount
    const token = localStorage.getItem("jwt_token");
    if (token) {
      // Initialize auth state from stored token
      dispatch(initializeAuth());
    } else {
      // Nothing to restore. Say so explicitly, otherwise route guards wait
      // forever for an initialisation that will never happen.
      dispatch(markAuthInitialized());
    }
  }, [dispatch]);

  return <>{children}</>;
}