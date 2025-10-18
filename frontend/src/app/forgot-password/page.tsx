'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      // For security, we always show success even on error
      // This prevents email enumeration attacks
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary-50">
        <div className="max-w-md w-full bg-background rounded-2xl shadow-xl p-8 border border-border text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Check Your Email</h2>
          <p className="text-text-secondary mb-6">
            If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <div className="bg-secondary-50 rounded-lg p-4 mb-6 border border-secondary-200">
            <p className="text-body-sm text-text-secondary">
              Didn't receive the email? Check your spam folder or contact your administrator.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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
            <div className="relative w-24 h-24 mx-auto">
              <Image
                src="/Logo.jpeg"
                alt="Batal Sports Academy Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Forgot Password?</h2>
          <p className="text-text-secondary">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {/* Form Container */}
        <div className="bg-background rounded-2xl shadow-xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="alert-error">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-caption mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className={error ? 'input-error' : 'input-base'}
                placeholder="Enter your email address"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
            <p className="text-body-sm text-text-secondary text-center">
              🔒 For security, we don't reveal whether an email exists in our system
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover transition-colors duration-200 underline underline-offset-4">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
