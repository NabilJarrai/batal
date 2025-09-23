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
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Assign Coach (Optional)
                    </label>
                    <Listbox 
                      value={formData.coachId} 
                      onChange={(value) => setFormData({...formData, coachId: value})}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                          <span className="block truncate">
                            {formData.coachId 
                              ? availableCoaches.find(c => c.id === formData.coachId)?.firstName + ' ' + 
                                availableCoaches.find(c => c.id === formData.coachId)?.lastName
                              : 'Select a coach (optional)'}
                          </span>
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
                          <Listbox.Options className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-background border border-border rounded-lg shadow-lg">
                            <Listbox.Option
                              value={undefined}
                              className={({ active }) =>
                                `cursor-pointer px-3 py-2 ${
                                  active ? 'bg-secondary text-text-primary' : 'text-text-secondary'
                                }`
                              }
                            >
                              No coach assigned
                            </Listbox.Option>
                            {availableCoaches.map((coach) => (
                              <Listbox.Option
                                key={coach.id}
                                value={coach.id}
                                className={({ active }) =>
                                  `cursor-pointer px-3 py-2 ${
                                    active ? 'bg-secondary text-text-primary' : 'text-text-secondary'
                                  }`
                                }
                              >
                                {coach.firstName} {coach.lastName}
                                {coach.title && <span className="text-xs text-text-secondary ml-2">({coach.title})</span>}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                    {availableCoaches.length === 0 && (
                      <p className="text-xs text-accent-yellow mt-1">No coaches available. Create a coach user first.</p>
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