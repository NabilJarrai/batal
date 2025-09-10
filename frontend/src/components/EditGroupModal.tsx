"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GroupResponse, AgeGroup, Level, AGE_GROUP_METADATA } from '@/types/groups';
import { groupsAPI } from '@/lib/api';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (group: GroupResponse) => void;
  groupId: number | null;
}

export default function EditGroupModal({ 
  isOpen, 
  onClose, 
  onComplete,
  groupId 
}: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    level: Level.DEVELOPMENT,
    ageGroup: AgeGroup.COOKIES,
    capacity: 20,
    zone: '',
    description: '',
    isActive: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load group data when modal opens
  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupData();
    }
  }, [isOpen, groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    try {
      const group = await groupsAPI.getById(groupId);
      setFormData({
        name: group.name || '',
        level: group.level || Level.DEVELOPMENT,
        ageGroup: group.ageGroup || AgeGroup.COOKIES,
        capacity: group.capacity || 20,
        zone: group.zone || '',
        description: group.description || '',
        isActive: group.isActive
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedGroup = await groupsAPI.update(groupId, formData);
      onComplete(updatedGroup);
      handleClose();
    } catch (err) {
      console.error('Error updating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to update group');
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-white mb-4">
                  Edit Group
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter group name"
                    />
                  </div>

                  {/* Age Group Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200 text-left
                              ${formData.ageGroup === ageGroup
                                ? `border-current bg-gradient-to-br ${getAgeGroupColor(ageGroup)} text-white shadow-lg`
                                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                              }
                            `}
                          >
                            <div className="font-medium">{ageGroup}</div>
                            <div className="text-xs opacity-75">Ages {meta.minAge}-{meta.maxAge}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Level *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(Level).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({...formData, level})}
                          className={`
                            p-3 rounded-lg border-2 transition-all duration-200 text-left
                            ${formData.level === level
                              ? `border-current bg-gradient-to-br ${getLevelColor(level)} text-white shadow-lg`
                              : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                            }
                          `}
                        >
                          <div className="font-medium">{level}</div>
                          <div className="text-xs opacity-75">
                            {level === Level.DEVELOPMENT ? 'Foundation skills' : 'Advanced training'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity and Zone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={30}
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 20})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Zone/Location
                      </label>
                      <input
                        type="text"
                        value={formData.zone}
                        onChange={(e) => setFormData({...formData, zone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Field A, Pitch 1, etc."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      placeholder="Optional description for this group..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-300">Active Group</span>
                    </label>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
                    <div className={`
                      bg-gradient-to-br ${getAgeGroupColor(formData.ageGroup)} 
                      text-white p-3 rounded-lg
                    `}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold">{formData.name || 'Group Name'}</h5>
                        <span className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${getLevelColor(formData.level)}`}>
                          {formData.level}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">
                        {formData.ageGroup} • Ages {metadata.minAge}-{metadata.maxAge} • Capacity: {formData.capacity}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white rounded-lg font-medium transition-colors duration-200"
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
                        'Update Group'
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