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
    password: '',
    phone: '',
    gender: Gender.MALE,
    userType: UserType.COACH,
    title: '',
    address: '',
    isActive: true
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
      password: '',
      phone: '',
      gender: Gender.MALE,
      userType: UserType.COACH,
      title: '',
      address: '',
      isActive: true
    });
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const getUserTypeColor = (type: UserType) => {
    switch (type) {
      case UserType.ADMIN: return 'text-purple-400';
      case UserType.MANAGER: return 'text-red-400';
      case UserType.COACH: return 'text-blue-400';
      default: return 'text-gray-400';
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-white mb-4">
                  Add New Staff Member
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      User Type *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.values(UserType).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, userType: type})}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.userType === type
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <p className={`font-medium ${
                            formData.userType === type ? getUserTypeColor(type) : 'text-gray-300'
                          }`}>
                            {type}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {type === UserType.ADMIN && 'Full system access'}
                            {type === UserType.MANAGER && 'Academy oversight'}
                            {type === UserType.COACH && 'Group management'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Min 6 characters"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Gender
                      </label>
                      <Listbox 
                        value={formData.gender} 
                        onChange={(value) => setFormData({...formData, gender: value})}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <span className="block truncate">{formData.gender}</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
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
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                              {Object.values(Gender).map((gender) => (
                                <Listbox.Option
                                  key={gender}
                                  value={gender}
                                  className={({ active }) =>
                                    `cursor-pointer px-3 py-2 ${
                                      active ? 'bg-gray-600 text-white' : 'text-gray-300'
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
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Title/Position
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder={
                          formData.userType === UserType.COACH ? 'Head Coach, Assistant Coach...' :
                          formData.userType === UserType.MANAGER ? 'Academy Director, Operations Manager...' :
                          'System Administrator'
                        }
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter address"
                    />
                  </div>

                  {/* Status */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="h-4 w-4 rounded text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">Active Account</p>
                        <p className="text-xs text-gray-400">
                          User will be able to log in immediately
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create User'}
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