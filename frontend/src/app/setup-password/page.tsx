'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/store/hooks';
import { setupPasswordWithToken } from '@/store/authSlice';

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { dispatch, isAuthenticated, user, isLoading, error } = useAuth();

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

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Resend email state
  const [resend, setResend] = useState({
    email: '',
    isResending: false,
    success: false,
    error: '',
    cooldownSeconds: 0,
  });

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.roles?.[0];
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'MANAGER') router.push('/manager');
      else if (role === 'COACH') router.push('/coach');
      else if (role === 'PARENT') router.push('/parent/dashboard');
      else router.push('/player/dashboard');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!token) {
      setValidation({
        isValidating: false,
        isValid: false,
        message: 'No token provided',
        userEmail: '',
        userName: '',
      });
      return;
    }

    // Validate token
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/validate-setup-token?token=${token}`)
      .then((res) => res.json())
      .then((response) => {
        setValidation({
          isValidating: false,
          isValid: response.valid,
          message: response.message,
          userEmail: response.userEmail || '',
          userName: response.userName || '',
        });
      })
      .catch(() => {
        setValidation({
          isValidating: false,
          isValid: false,
          message: 'Failed to validate token',
          userEmail: '',
          userName: '',
        });
      });
  }, [token]);

  // Pre-fill email from validation response
  useEffect(() => {
    if (validation.userEmail && !resend.email) {
      setResend((prev) => ({ ...prev, email: validation.userEmail }));
    }
  }, [validation.userEmail, resend.email]);

  // Cooldown timer
  useEffect(() => {
    if (resend.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setResend((prev) => ({ ...prev, cooldownSeconds: prev.cooldownSeconds - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resend.cooldownSeconds]);

  const handleResendEmail = async () => {
    if (!resend.email || resend.isResending || resend.cooldownSeconds > 0) return;

    setResend((prev) => ({ ...prev, isResending: true, error: '', success: false }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/resend-setup-email-by-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resend.email }),
        }
      );

      const data = await response.json();

      if (response.status === 429) {
        // Rate limit error - extract seconds from message
        const match = data.message.match(/(\d+) seconds/);
        const seconds = match ? parseInt(match[1]) : 300;
        setResend((prev) => ({
          ...prev,
          isResending: false,
          error: data.message,
          cooldownSeconds: seconds,
        }));
      } else if (response.ok) {
        setResend((prev) => ({
          ...prev,
          isResending: false,
          success: true,
          cooldownSeconds: 300, // 5 minutes
        }));
      } else {
        setResend((prev) => ({
          ...prev,
          isResending: false,
          error: data.message || 'Failed to resend email',
        }));
      }
    } catch (err) {
      setResend((prev) => ({
        ...prev,
        isResending: false,
        error: 'Network error. Please try again.',
      }));
    }
  };

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
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});

    // Dispatch setup password action
    await dispatch(setupPasswordWithToken({
      token: token!,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    }));

    // Redirect is handled by the useEffect above when authentication succeeds
  };

  if (validation.isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-text-secondary">Validating your link...</p>
        </div>
      </div>
    );
  }

  if (!validation.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary-50">
        <div className="max-w-md w-full bg-background rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Invalid or Expired Link</h2>
            <p className="text-text-secondary mb-4">{validation.message}</p>
          </div>

          {/* Success Message */}
          {resend.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Email sent successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    If your account exists, you'll receive a new setup link shortly. Please check your email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {resend.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{resend.error}</p>
              </div>
            </div>
          )}

          {/* Resend Form */}
          {!resend.success && (
            <div className="mb-6">
              <p className="text-sm text-text-secondary text-center mb-4">
                Need a new link? Enter your email below:
              </p>
              <input
                type="email"
                value={resend.email}
                onChange={(e) => setResend((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="input-field w-full mb-4"
                disabled={resend.isResending || resend.cooldownSeconds > 0}
              />
              <button
                onClick={handleResendEmail}
                disabled={!resend.email || resend.isResending || resend.cooldownSeconds > 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resend.isResending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : resend.cooldownSeconds > 0 ? (
                  `Wait ${Math.floor(resend.cooldownSeconds / 60)}:${String(resend.cooldownSeconds % 60).padStart(2, '0')}`
                ) : (
                  'Resend Setup Email'
                )}
              </button>
            </div>
          )}

          {/* Alternative Options */}
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-4">
              Or contact your administrator for assistance
            </p>
            <button onClick={() => router.push('/login')} className="btn-secondary w-full">
              Go to Login
            </button>
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
          <h2 className="text-2xl font-bold text-text-primary mb-2">Set Your Password</h2>
          <p className="text-text-secondary">Welcome, <strong>{validation.userName}</strong>!</p>
          <p className="text-text-secondary text-sm">{validation.userEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert-error">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
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
                setValidationErrors({});
              }}
              className={validationErrors.password ? 'input-error' : 'input-base'}
              placeholder="Enter your password (min. 8 characters)"
              disabled={isLoading}
            />
            {validationErrors.password && (
              <p className="text-sm text-accent-red mt-1">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-caption mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setValidationErrors({});
              }}
              className={validationErrors.confirmPassword ? 'input-error' : 'input-base'}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <p className="text-sm text-accent-red mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.password || !formData.confirmPassword}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Setting Password...
              </div>
            ) : (
              'Set Password & Continue'
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

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  );
}
