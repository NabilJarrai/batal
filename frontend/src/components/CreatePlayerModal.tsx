"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, Level, BasicFoot } from '@/types/players';
import { AgeGroup } from '@/types/groups';
import { apiClient } from '@/lib/apiClient';
import { AssignmentService } from '@/services/assignmentService';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function CreatePlayerModal({ 
  isOpen, 
  onClose, 
  onComplete 
}: CreatePlayerModalProps) {
  const [formData, setFormData] = useState<Partial<PlayerDTO>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    parentName: '',
    dateOfBirth: '',
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
    isActive: true,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const [autoAssign, setAutoAssign] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    console.log('Submitting player data:', formData);

    try {
      // Create the player
      const createdPlayer = await apiClient.post<PlayerDTO>('/players', formData);
      console.log('Player created successfully:', createdPlayer);
      
      // Auto-assign if requested
      if (autoAssign && formData.dateOfBirth) {
        const group = await AssignmentService.autoAssignPlayer(createdPlayer);
        if (group) {
          console.log(`Player assigned to group: ${group.name}`);
        }
      }

      onComplete();
      handleClose();
    } catch (err) {
      console.error('Error creating player:', err);
      setError(err instanceof Error ? err.message : 'Failed to create player');
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
      parentName: '',
      dateOfBirth: '',
      basicFoot: BasicFoot.RIGHT,
      level: Level.DEVELOPMENT,
      isActive: true,
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setAutoAssign(true);
    setError(null);
    onClose();
  };

  const calculateAgeGroup = () => {
    if (!formData.dateOfBirth) return null;
    return AssignmentService.getAgeGroup(formData.dateOfBirth);
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
                  Add New Player
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Contact Information */}
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
                        placeholder="player@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* Parent Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Parent/Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter parent/guardian name"
                    />
                  </div>

                  {/* Player Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      {formData.dateOfBirth && (
                        <p className="text-xs text-blue-300 mt-1">
                          Age Group: {calculateAgeGroup() || 'Outside age range'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* Football Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Preferred Foot
                      </label>
                      <Listbox 
                        value={formData.basicFoot} 
                        onChange={(value) => setFormData({...formData, basicFoot: value})}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <span className="block truncate">{formData.basicFoot}</span>
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
                              {Object.values(BasicFoot).map((foot) => (
                                <Listbox.Option
                                  key={foot}
                                  value={foot}
                                  className={({ active }) =>
                                    `cursor-pointer px-3 py-2 ${
                                      active ? 'bg-gray-600 text-white' : 'text-gray-300'
                                    }`
                                  }
                                >
                                  {foot}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Level
                      </label>
                      <Listbox 
                        value={formData.level} 
                        onChange={(value) => setFormData({...formData, level: value})}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <span className="block truncate">{formData.level}</span>
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
                              {Object.values(Level).map((level) => (
                                <Listbox.Option
                                  key={level}
                                  value={level}
                                  className={({ active }) =>
                                    `cursor-pointer px-3 py-2 ${
                                      active ? 'bg-gray-600 text-white' : 'text-gray-300'
                                    }`
                                  }
                                >
                                  {level}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  {/* Auto-assign Option */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={autoAssign}
                        onChange={(e) => setAutoAssign(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">Auto-assign to group</p>
                        <p className="text-xs text-gray-400">
                          Automatically assign player to an appropriate group based on age and level
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
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Player'}
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