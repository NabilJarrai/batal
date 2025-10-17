"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks";
import { loginUser, clearError } from "@/store/authSlice";

// Enhanced error interface matching API error structure
interface EnhancedError extends Error {
  status?: number;
  type?: 'AUTHENTICATION' | 'VALIDATION' | 'NETWORK' | 'SERVER' | 'UNKNOWN';
  details?: any;
}

export default function LoginFormClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error, user, dispatch } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [errorDetails, setErrorDetails] = useState<{
    type?: string;
    canRetry?: boolean;
    suggestion?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.roles?.includes('ADMIN')) {
        router.push('/admin');
      } else if (user.roles?.includes('MANAGER')) {
        router.push('/manager');
      } else if (user.roles?.includes('COACH')) {
        router.push('/coach');
      } else if (user.roles?.includes('PARENT')) {
        router.push('/parent/dashboard');
      } else {
        // Default fallback
        router.push('/player/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // Clear validation errors when form changes (but keep API errors until user submits again)
  useEffect(() => {
    setValidationErrors({});
  }, [formData.email, formData.password]);

  // Analyze error details for better user feedback
  useEffect(() => {
    if (error) {
      const enhancedError = error as unknown as EnhancedError;
      const errorType = enhancedError.type || 'UNKNOWN';

      let canRetry = true;
      let suggestion = '';

      switch (errorType) {
        case 'AUTHENTICATION':
          suggestion = 'Double-check your email and password, then try again.';
          break;
        case 'NETWORK':
          suggestion = 'Check your internet connection and try again.';
          break;
        case 'SERVER':
          suggestion = 'Our servers are experiencing issues. Please try again in a few minutes.';
          break;
        case 'VALIDATION':
          suggestion = 'Please check your input format.';
          canRetry = false;
          break;
        default:
          suggestion = 'Something went wrong. Please try again.';
      }

      setErrorDetails({ type: errorType, canRetry, suggestion });
    }
  }, [error]);

  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear any previous API errors before making new login attempt
    if (error) {
      dispatch(clearError());
    }
    setErrorDetails({});

    // Dispatch login action
    await dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }));
  };

  // Demo credentials for quick access
  const fillDemoCredentials = (role: 'admin' | 'manager' | 'coach' | 'parent') => {
    switch(role) {
      case 'admin':
        setFormData({ email: 'admin@batal.com', password: 'admin123' });
        break;
      case 'manager':
        setFormData({ email: 'manager@batal.com', password: 'manager123' });
        break;
      case 'coach':
        setFormData({ email: 'coach@batal.com', password: 'coach123' });
        break;
      case 'parent':
        setFormData({ email: 'parent1@batal.com', password: 'parent123' });
        break;
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Error Message */}
        {error && (
          <div className="alert-error">
            {/* Error Icon - different based on error type */}
            {errorDetails.type === 'NETWORK' ? (
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
              </svg>
            ) : errorDetails.type === 'SERVER' ? (
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}

            <div className="flex-1">
              <p className="text-body font-medium mb-1">
                {errorDetails.type === 'AUTHENTICATION' ? 'Incorrect credentials' : 'Sign In Failed'}
              </p>
              <p className="text-body-sm">
                {errorDetails.type === 'AUTHENTICATION'
                  ? errorDetails.suggestion
                  : error
                }
              </p>
              {errorDetails.type === 'AUTHENTICATION' && (
                <div className="mt-3 flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(clearError());
                      setErrorDetails({});
                      // Focus on email field to help user retry
                      document.getElementById('email')?.focus();
                    }}
                    className="btn-ghost btn-xs"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Contact your administrator for password reset assistance.')}
                    className="btn-ghost btn-xs"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="text-caption mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={validationErrors.email ? 'input-error' : 'input-base'}
            placeholder="Enter your email"
          />
          {validationErrors.email && (
            <p className="mt-1 text-body-sm text-accent-red">{validationErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="text-caption mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={validationErrors.password ? 'input-error' : 'input-base'}
            placeholder="Enter your password"
          />
          {validationErrors.password && (
            <p className="mt-1 text-body-sm text-accent-red">{validationErrors.password}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => alert('Contact your administrator for password reset assistance.')}
              className="btn-ghost btn-xs"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Remember Me & Submit */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-text-primary">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Boolean(error && errorDetails.canRetry === false)}
            className="btn-primary btn-lg w-full"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="loading-spinner mr-3"></div>
                Signing in...
              </div>
            ) : (
              <>
                <span className="mr-2">
                  {error && !errorDetails.canRetry ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {error && !errorDetails.canRetry ? 'Please Fix Errors Above' : 'Sign in to Academy'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Demo Credentials */}
      <div className="mt-6 pt-6 divider">
        <p className="text-body-sm text-center mb-3">Quick demo access (for testing):</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => fillDemoCredentials('admin')}
            className="btn-outline btn-sm flex flex-col items-center"
          >
            <div className="font-medium">Admin</div>
            <div className="text-[10px] opacity-75">Full access</div>
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('manager')}
            className="btn-outline btn-sm flex flex-col items-center"
          >
            <div className="font-medium">Manager</div>
            <div className="text-[10px] opacity-75">Analytics</div>
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('coach')}
            className="btn-outline btn-sm flex flex-col items-center"
          >
            <div className="font-medium">Coach</div>
            <div className="text-[10px] opacity-75">Groups</div>
          </button>
          <button
            type="button"
            onClick={() => fillDemoCredentials('parent')}
            className="btn-outline btn-sm flex flex-col items-center"
          >
            <div className="font-medium">Parent</div>
            <div className="text-[10px] opacity-75">Children</div>
          </button>
        </div>
      </div>
    </>
  );
}