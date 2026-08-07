"use client";

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usersAPI } from '@/lib/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  userName?: string;
  userEmail?: string;
  onSuccess?: () => void;
}

const MIN_LENGTH = 8;

export default function ResetPasswordModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  onSuccess,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Never carry one user's typed password over to the next user's dialog.
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError(null);
      setDone(false);
    }
  }, [isOpen, userId]);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    !isLoading && password.length >= MIN_LENGTH && password === confirmPassword;

  const handleSubmit = async () => {
    if (!userId || !canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      await usersAPI.resetPassword(userId, password, confirmPassword);
      setDone(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Could not reset the password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                {done ? (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Password updated
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-600">
                      {userName || 'This user'} can now sign in with the new password.
                      Share it with them directly — it is not sent by email.
                    </p>
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      If they are currently signed in elsewhere, that session stays
                      active until their token expires.
                    </p>
                    <div className="mt-6 flex justify-end">
                      <button type="button" className="btn-primary" onClick={onClose}>
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Reset password
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      Set a new password for{' '}
                      <span className="font-medium text-gray-900">
                        {userName || 'this user'}
                      </span>
                      {userEmail ? ` (${userEmail})` : ''}. You will need to pass it on
                      to them yourself.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          New password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          placeholder={`At least ${MIN_LENGTH} characters`}
                        />
                        {tooShort && (
                          <p className="mt-1 text-xs text-red-600">
                            Must be at least {MIN_LENGTH} characters.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Confirm password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                        {mismatch && (
                          <p className="mt-1 text-xs text-red-600">
                            Passwords do not match.
                          </p>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                        />
                        Show password
                      </label>
                    </div>

                    {error && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                      >
                        {isLoading ? 'Saving…' : 'Set password'}
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
