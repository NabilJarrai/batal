'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authAPI } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState({
    isValidating: true,
    isValid: false,
    message: '',
    userEmail: '',
    userName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidation({
        isValidating: false,
        isValid: false,
        message: 'No reset token provided',
        userEmail: '',
        userName: '',
      });
      return;
    }

    // Validate token
    authAPI.validateResetToken(token)
      .then((response) => {
        setValidation({
          isValidating: false,
          isValid: response.valid,
          message: response.message,
          userEmail: response.email || '',
          userName: response.userName || '',
        });
      })
      .catch(() => {
        setValidation({
          isValidating: false,
          isValid: false,
          message: 'Failed to validate reset token',
          userEmail: '',
          userName: '',
        });
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await authAPI.resetPassword({
        token: token!,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Redirect to login with success message
      router.push('/login?reset=success');

    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to reset password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validation.isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  if (!validation.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary-50">
        <div className="max-w-md w-full bg-background rounded-2xl shadow-xl p-8 border border-border text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Invalid or Expired Link</h2>
          <p className="text-text-secondary mb-6">{validation.message}</p>
          <p className="text-sm text-text-secondary mb-6">
            The password reset link may have expired or already been used. Please request a new password reset.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/forgot-password')}
              className="btn-primary w-full"
            >
              Request New Reset Link
            </button>
            <Link
              href="/login"
              className="block text-primary hover:text-primary-hover transition-colors duration-200 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary-50">
      <div className="max-w-md w-full bg-background rounded-2xl shadow-xl p-8 border border-border">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 p-4 bg-background rounded-2xl shadow-lg w-fit border border-border">
            <div className="relative w-20 h-20 mx-auto">
              <Image
                src="/Logo.jpeg"
                alt="Batal Sports Academy Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Reset Your Password</h2>
          {validation.userName && (
            <>
              <p className="text-text-secondary">Welcome, <strong>{validation.userName}</strong>!</p>
              <p className="text-text-secondary text-sm">{validation.userEmail}</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="alert-error">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{errors.general}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="text-caption mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setErrors({});
              }}
              className={errors.password ? 'input-error' : 'input-base'}
              placeholder="Enter your new password (min. 8 characters)"
              disabled={isSubmitting}
              autoFocus
            />
            {errors.password && (
              <p className="text-sm text-accent-red mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-caption mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setErrors({});
              }}
              className={errors.confirmPassword ? 'input-error' : 'input-base'}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-accent-red mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.password || !formData.confirmPassword}
            className="btn-primary w-full"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Resetting Password...
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
          <p className="text-body-sm text-text-secondary text-center">
            🔒 Your password will be encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
