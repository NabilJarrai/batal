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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    )
  }
);

export default function LoginPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-2xl w-fit">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">⚽</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-blue-200">Sign in to your Batal Academy account</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          }>
            <LoginFormClient />
          </Suspense>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-blue-200">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-cyan-300 hover:text-cyan-100 transition-colors duration-200 underline underline-offset-4">
              Create account
            </Link>
          </p>
          <p className="text-sm text-blue-200">
            <Link href="/" className="font-medium text-cyan-300 hover:text-cyan-100 transition-colors duration-200">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}