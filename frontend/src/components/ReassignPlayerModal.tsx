"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO } from '@/types/players';
import { GroupResponse } from '@/types/groups';
import { groupsAPI } from '@/lib/api';

interface ReassignPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newGroupId: number) => void;
  player: PlayerDTO | null;
  currentGroupId: number;
  currentGroupName: string;
  isLoading?: boolean;
}

export default function ReassignPlayerModal({
  isOpen,
  onClose,
  onConfirm,
  player,
  currentGroupId,
  currentGroupName,
  isLoading = false
}: ReassignPlayerModalProps) {
  const [availableGroups, setAvailableGroups] = useState<GroupResponse[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available groups when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableGroups();
    }
  }, [isOpen]);

  const loadAvailableGroups = async () => {
    setLoadingGroups(true);
    setError(null);
    
    try {
      const groups = await groupsAPI.getAll();
      // Filter out the current group and show groups that aren't full
      const availableForReassignment = groups.filter((group: GroupResponse) => 
        group.id !== currentGroupId && 
        !group.isFull && 
        group.isActive
      );
      
      // Sort groups consistently
      availableForReassignment.sort((a: GroupResponse, b: GroupResponse) => {
        const nameComparison = a.name.localeCompare(b.name);
        if (nameComparison !== 0) return nameComparison;
        return a.id - b.id;
      });
      
      setAvailableGroups(availableForReassignment);
      
      if (availableForReassignment.length === 0) {
        setError('No available groups for reassignment');
      }
    } catch (err) {
      console.error('Failed to load groups for reassignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load available groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleConfirm = () => {
    if (selectedGroup) {
      onConfirm(selectedGroup.id);
      onClose();
      setSelectedGroup(null);
    }
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setError(null);
    onClose();
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
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-visible bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg className="w-6 h-6 text-text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Reassign Player
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-text-secondary mb-4">
                    Move <strong className="text-white">{player?.firstName} {player?.lastName}</strong> from <strong className="text-white">{currentGroupName}</strong> to a new group:
                  </p>
                  
                  {loadingGroups ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="loading-spinner w-6 h-6"></div>
                      <span className="ml-2 text-sm text-text-secondary">Loading groups...</span>
                    </div>
                  ) : availableGroups.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Select New Group ({availableGroups.length} available)
                      </label>
                      <Listbox value={selectedGroup} onChange={setSelectedGroup}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center justify-between">
                            <span>
                              {selectedGroup 
                                ? `${selectedGroup.name} - ${selectedGroup.level} (${selectedGroup.availableSpots} spots)`
                                : 'Choose a group...'}
                            </span>
                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                              >
                                <div>
                                  <div className="font-medium">{group.name}</div>
                                  <div className="text-sm text-text-secondary">
                                    {group.level} • {group.availableSpots} spots available
                                  </div>
                                </div>
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v2m-2-6a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-text-secondary">No available groups</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        All other groups are either full or inactive.
                      </p>
                    </div>
                  )}
                  
                  {selectedGroup && (
                    <div className="mt-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-text-secondary">
                        <strong>Moving to:</strong> {selectedGroup.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {selectedGroup.level} • {selectedGroup.availableSpots} spots available after assignment
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="btn-secondary btn-md flex-1"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading || !selectedGroup}
                    className="btn-primary btn-md flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="loading-spinner mr-2"></div>
                        Reassigning...
                      </div>
                    ) : (
                      'Reassign Player'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}