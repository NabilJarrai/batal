"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { GroupResponse, GroupCreateRequest, AgeGroup, AGE_GROUP_METADATA } from '@/types/groups';
import { Level } from '@/types/players';
import { UserResponse, UserType } from '@/types/users';
import { apiClient } from '@/lib/apiClient';
import { groupsAPI, usersAPI } from '@/lib/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (group: GroupResponse) => void;
}

export default function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: CreateGroupModalProps) {
  const [formData, setFormData] = useState<GroupCreateRequest>({
    name: '',
    level: Level.DEVELOPMENT,
    ageGroup: AgeGroup.COOKIES,
    capacity: 20,
    coachId: undefined,
    zone: '',
    description: '',
    isActive: true
  });

  const [availableCoaches, setAvailableCoaches] = useState<UserResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableCoaches();
    }
  }, [isOpen]);

  const loadAvailableCoaches = async () => {
    try {
      const usersResponse = await usersAPI.getAll();
      const users = usersResponse.content || usersResponse;
      const coaches = users.filter(u =>
        u.userType === UserType.COACH && u.isActive
      );
      setAvailableCoaches(coaches);
    } catch (err) {
      console.error('Failed to load coaches:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Creating group with data:', formData);
      const createdGroup = await groupsAPI.create(formData);
      console.log('Group created successfully:', createdGroup);
      onComplete(createdGroup);
      handleClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      level: Level.DEVELOPMENT,
      ageGroup: AgeGroup.COOKIES,
      capacity: 20,
      coachId: undefined,
      zone: '',
      description: '',
      isActive: true
    });
    setError(null);
    onClose();
  };

  const getAgeGroupColor = (ageGroup: AgeGroup) => {
    switch (ageGroup) {
      case AgeGroup.COOKIES: return 'from-yellow-500 to-yellow-600';
      case AgeGroup.DOLPHINS: return 'from-blue-500 to-blue-600';
      case AgeGroup.TIGERS: return 'from-orange-500 to-orange-600';
      case AgeGroup.LIONS: return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelColor = (level: Level) => {
    return level === Level.DEVELOPMENT
      ? 'from-blue-500 to-blue-600'
      : 'from-purple-500 to-purple-600';
  };

  const metadata = AGE_GROUP_METADATA[formData.ageGroup];

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
                <Dialog.Title as="h3" className="text-heading-4 mb-4">
                  Create New Group
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Age Group Selection */}
                  <div>
                    <label className="text-caption mb-2">
                      Age Group *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(AgeGroup).map((ageGroup) => {
                        const meta = AGE_GROUP_METADATA[ageGroup];
                        return (
                          <button
                            key={ageGroup}
                            type="button"
                            onClick={() => setFormData({...formData, ageGroup})}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.ageGroup === ageGroup
                                ? 'border-primary bg-primary/20'
                                : 'border-border bg-secondary-100 hover:bg-secondary'
                            }`}
                          >
                            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-text-primary bg-gradient-to-r ${getAgeGroupColor(ageGroup)} mb-2`}>
                              {meta.displayName}
                            </div>
                            <p className="text-sm text-text-secondary">Ages {meta.minAge}-{meta.maxAge}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level Selection */}
                  <div>
                    <label className="text-caption mb-2">
                      Level *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(Level).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, level})}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.level === level
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-border bg-background hover:bg-secondary-100'
                          }`}
                        >
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium text-text-primary bg-gradient-to-r ${getLevelColor(level)} mb-2`}>
                            {level}
                          </div>
                          <p className="text-xs text-text-secondary">
                            {level === Level.DEVELOPMENT ? 'Foundation skills' : 'Competitive training'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Group Name */}
                  <div>
                    <label className="text-caption mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-base"
                      placeholder="e.g., Development Lions Elite, Advanced Tigers 2, etc."
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Choose a unique name for this group
                    </p>
                  </div>

                  {/* Group Details */}
                  <div className="alert-info">
                    <p className="text-sm text-text-primary mb-2">Group Details:</p>
                    <p className="text-lg font-medium text-text-primary">
                      {metadata.displayName} • {formData.level === Level.ADVANCED ? 'Advanced' : 'Development'} Level
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      For ages {metadata.minAge}-{metadata.maxAge} • Capacity: {formData.capacity} players
                    </p>
                  </div>

                  {/* Capacity and Zone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="30"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        className="input-base"
                        placeholder="20"
                      />
                      <p className="text-xs text-text-secondary mt-1">Maximum number of players</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Zone/Location
                      </label>
                      <input
                        type="text"
                        value={formData.zone || ''}
                        onChange={(e) => setFormData({...formData, zone: e.target.value})}
                        className="input-base"
                        placeholder="North Field, Main Campus..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="input-base"
                      placeholder="Additional notes about this group..."
                    />
                  </div>

                  {/* Coach Assignment (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Assign Coach (Optional)
                    </label>
                    <Listbox
                      value={formData.coachId}
                      onChange={(value) => setFormData({...formData, coachId: value})}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary text-left hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">
                          <span className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="block truncate">
                              {formData.coachId
                                ? (() => {
                                    const selectedCoach = availableCoaches.find(c => c.id === formData.coachId);
                                    return selectedCoach
                                      ? `${selectedCoach.firstName} ${selectedCoach.lastName}${selectedCoach.title ? ` - ${selectedCoach.title}` : ''}`
                                      : 'Select a coach...';
                                  })()
                                : 'Select a coach...'}
                            </span>
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
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
                          <Listbox.Options className="absolute z-50 mt-2 w-full max-h-72 overflow-auto bg-background border-2 border-border rounded-xl shadow-2xl py-1 focus:outline-none">
                            <Listbox.Option
                              value={undefined}
                              className={({ active, selected }) =>
                                `cursor-pointer select-none relative px-4 py-3 transition-colors ${
                                  active ? 'bg-primary/10 text-text-primary' : 'text-text-secondary'
                                } ${selected ? 'font-medium' : ''}`
                              }
                            >
                              {({ selected }) => (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className={selected ? 'font-medium' : ''}>No coach assigned</p>
                                    <p className="text-xs text-text-secondary">Group will be created without a coach</p>
                                  </div>
                                  {selected && (
                                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </Listbox.Option>

                            {availableCoaches.length > 0 && (
                              <div className="border-t border-border my-1"></div>
                            )}

                            {availableCoaches.map((coach) => (
                              <Listbox.Option
                                key={coach.id}
                                value={coach.id}
                                className={({ active, selected }) =>
                                  `cursor-pointer select-none relative px-4 py-3 transition-colors ${
                                    active ? 'bg-primary/10 text-text-primary' : 'text-text-primary'
                                  } ${selected ? 'font-medium bg-primary/5' : ''}`
                                }
                              >
                                {({ selected }) => (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                      {coach.firstName[0]}{coach.lastName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`truncate ${selected ? 'font-semibold text-primary' : 'font-medium'}`}>
                                        {coach.firstName} {coach.lastName}
                                      </p>
                                      {coach.title && (
                                        <p className="text-xs text-text-secondary truncate">{coach.title}</p>
                                      )}
                                    </div>
                                    {selected && (
                                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                    {availableCoaches.length === 0 && (
                      <div className="mt-2 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
                        <p className="text-xs text-accent-yellow flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No coaches available. Create a coach user first.
                        </p>
                      </div>
                    )}
                    {availableCoaches.length > 0 && (
                      <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {availableCoaches.length} coach{availableCoaches.length !== 1 ? 'es' : ''} available
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="alert-success">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="h-4 w-4 rounded text-green-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Active Group</p>
                        <p className="text-xs text-text-secondary">
                          Players can be assigned to this group immediately
                        </p>
                      </div>
                    </label>
                  </div>

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
                      {isSubmitting ? 'Creating...' : 'Create Group'}
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