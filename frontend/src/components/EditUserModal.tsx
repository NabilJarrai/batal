"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { UserResponse, UserType } from '@/types/users';
import { usersAPI } from '@/lib/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedUser: UserResponse) => void;
  userId: number | null;
}

export default function EditUserModal({ 
  isOpen, 
  onClose, 
  onComplete,
  userId 
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: UserType.COACH,
    isActive: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const user = await usersAPI.getById(userId);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        userType: user.userType || UserType.COACH,
        isActive: user.isActive
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedUser = await usersAPI.update(userId, formData);
      onComplete(updatedUser);
      handleClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      userType: UserType.COACH,
      isActive: true
    });
    setError(null);
    onClose();
  };

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case UserType.ADMIN:
        return 'from-purple-500 to-purple-600';
      case UserType.MANAGER:
        return 'from-red-500 to-red-600';
      case UserType.COACH:
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-4">
                  Edit User
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* User Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      User Type *
                    </label>
                    <Listbox value={formData.userType} onChange={(value) => setFormData({...formData, userType: value})}>
                      <div className="relative">
                        <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getUserTypeColor(formData.userType)}`}>
                            {formData.userType}
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-background-modal border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                          {Object.values(UserType).map((type) => (
                            <Listbox.Option
                              key={type}
                              value={type}
                              className="px-3 py-2 hover:bg-secondary-100 cursor-pointer text-text-primary"
                            >
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getUserTypeColor(type)}`}>
                                {type}
                              </span>
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="form-checkbox h-4 w-4 text-primary bg-background border border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-secondary">Active User</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-secondary-600/50 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </div>
                      ) : (
                        'Update User'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}