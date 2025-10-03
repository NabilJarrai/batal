"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import the login form to avoid hydration issues with browser extensions
const LoginFormClient = dynamic(
  () => import('@/components/LoginFormClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function LoginPage() {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary-50 opacity-50"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(30,64,175,0.05),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.05),transparent_50%)]"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 p-4 bg-background rounded-2xl shadow-lg w-fit border border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">⚽</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome Back</h2>
          <p className="text-text-secondary">Sign in to your Batal Academy account</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-background rounded-2xl shadow-xl p-8 border border-border">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <LoginFormClient />
          </Suspense>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:text-primary-hover transition-colors duration-200 underline underline-offset-4">
              Create account
            </Link>
          </p>
          <p className="text-sm text-text-secondary">
            <Link href="/" className="font-medium text-primary hover:text-primary-hover transition-colors duration-200">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}