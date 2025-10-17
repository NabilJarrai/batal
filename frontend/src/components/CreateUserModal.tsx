"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { UserResponse, UserCreateRequest, UserType, Gender } from '@/types/users';
import { apiClient } from '@/lib/apiClient';
import { usersAPI } from '@/lib/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (user: UserResponse) => void;
}

export default function CreateUserModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: CreateUserModalProps) {
  const [formData, setFormData] = useState<UserCreateRequest>({
    firstName: '',
    lastName: '',
    email: '',
    // password removed - users set via email
    phone: '',
    gender: Gender.MALE,
    userType: UserType.COACH,
    title: '',
    address: '',
    isActive: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating user with data:', formData);
      const createdUser = await usersAPI.create(formData);
      console.log('User created successfully:', createdUser);
      onComplete(createdUser);
      handleClose();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      // password removed - users set via email
      phone: '',
      gender: Gender.MALE,
      userType: UserType.COACH,
      title: '',
      address: '',
      isActive: true
    });
    setError(null);
    onClose();
  };

  const getUserTypeColor = (type: UserType) => {
    switch (type) {
      case UserType.ADMIN: return 'text-text-primary';
      case UserType.MANAGER: return 'text-accent-red';
      case UserType.COACH: return 'text-text-primary';
      case UserType.PARENT: return 'text-blue-400';
      default: return 'text-text-secondary';
    }
  };

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
                  Add New Staff Member
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-body">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      User Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(UserType).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, userType: type})}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.userType === type
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-border bg-background hover:bg-secondary-100'
                          }`}
                        >
                          <p className={`font-medium ${
                            formData.userType === type ? getUserTypeColor(type) : 'text-text-secondary'
                          }`}>
                            {type}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {type === UserType.ADMIN && 'Full system access'}
                            {type === UserType.MANAGER && 'Academy oversight'}
                            {type === UserType.COACH && 'Group management'}
                            {type === UserType.PARENT && 'View children progress'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
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
                        className="input-base"
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
                        className="input-base"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Account Information */}
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
                        className="input-base"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="input-base"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* Password Setup Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-text-primary">📧 Password Setup via Email</p>
                        <p className="text-xs text-text-secondary mt-1">
                          User will receive an email with a secure link to set their password. The link expires in 48 hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Gender
                      </label>
                      <Listbox 
                        value={formData.gender} 
                        onChange={(value) => setFormData({...formData, gender: value})}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <span className="block truncate">{formData.gender}</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg">
                              {Object.values(Gender).map((gender) => (
                                <Listbox.Option
                                  key={gender}
                                  value={gender}
                                  className={({ active }) =>
                                    `cursor-pointer px-3 py-2 ${
                                      active ? 'bg-secondary text-text-primary' : 'text-text-secondary'
                                    }`
                                  }
                                >
                                  {gender}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Title/Position
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="input-base"
                        placeholder={
                          formData.userType === UserType.COACH ? 'Head Coach, Assistant Coach...' :
                          formData.userType === UserType.MANAGER ? 'Academy Director, Operations Manager...' :
                          formData.userType === UserType.PARENT ? 'Parent/Guardian' :
                          'System Administrator'
                        }
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Note: isActive is set to false by backend until password is set */}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary btn-md flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary btn-md flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="loading-spinner mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create User'
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