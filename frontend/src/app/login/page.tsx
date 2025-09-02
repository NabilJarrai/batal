"use client";

import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
            <Image
              src="/logo.svg"
              alt="Batal Academy Logo"
              width={60}
              height={60}
              className="mx-auto filter brightness-0 invert"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-blue-200">Sign in to your Batal Academy account</p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <LoginForm />
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-blue-200">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-cyan-300 hover:text-cyan-100 transition-colors duration-200 underline underline-offset-4"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
