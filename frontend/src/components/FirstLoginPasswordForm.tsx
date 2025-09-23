"use client";

import { useState } from "react";
import { useAuth } from "@/store/hooks";
import { tokenManager } from "@/lib/api";

interface FirstLoginPasswordFormProps {
  onPasswordChanged: () => void;
  onCancel?: () => void;
}

export default function FirstLoginPasswordForm({
  onPasswordChanged,
  onCancel
}: FirstLoginPasswordFormProps) {
  const { dispatch } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const token = tokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/change-first-login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to change password');
      }

      const loginResponse = await response.json();

      // Update token in localStorage
      if (loginResponse.token) {
        tokenManager.setToken(loginResponse.token);
      }

      onPasswordChanged();
    } catch (error) {
      console.error('Password change failed:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to change password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl shadow-xl p-8 border border-border max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-primary to-primary-hover rounded-full w-fit">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 1 1 8 0c0 1.098-.5 2.095-1.316 2.777A3.989 3.989 0 0 1 15 21H9a3.989 3.989 0 0 1-1.684-1.223A4.992 4.992 0 0 1 6 16a4 4 0 0 1 4-4Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Set Your Password</h2>
          <p className="text-text-secondary text-sm">
            For security reasons, you must change your default password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="alert-error">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-body">{errors.general}</p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="text-caption mb-2">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={errors.currentPassword ? 'input-error' : 'input-base'}
              placeholder="Enter your current password"
              disabled={isLoading}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-body-sm text-accent-red">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="text-caption mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={errors.newPassword ? 'input-error' : 'input-base'}
              placeholder="Enter your new password (min. 8 characters)"
              disabled={isLoading}
            />
            {errors.newPassword && (
              <p className="mt-1 text-body-sm text-accent-red">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-body-sm text-text-secondary">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="text-caption mb-2">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={errors.confirmPassword ? 'input-error' : 'input-base'}
              placeholder="Confirm your new password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-body-sm text-accent-red">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-4 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
          <p className="text-body-sm text-text-secondary text-center">
            🔒 Your password will be encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}