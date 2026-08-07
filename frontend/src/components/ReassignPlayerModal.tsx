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


/**
 * Why a target group may not suit this player. Empty means a clean fit.
 *
 * These never block the move: an admin moving a player by hand may be doing it
 * on purpose, for a trial or a mid-season promotion.
 */
function fitWarnings(player: PlayerDTO | null, group: GroupResponse): string[] {
  const warnings: string[] = [];

  if (group.isFull) {
    warnings.push(`already at ${group.currentPlayerCount}/${group.capacity}`);
  }

  if (player?.level && group.level && player.level !== group.level) {
    warnings.push(`${group.level.toLowerCase()} group, player is ${player.level.toLowerCase()}`);
  }

  if (player?.dateOfBirth) {
    const birth = new Date(player.dateOfBirth);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      if (age < group.minAge || age > group.maxAge) {
        warnings.push(`age ${age} is outside ${group.minAge}-${group.maxAge}`);
      }
    }
  }

  if (!group.assessmentTemplateId) {
    warnings.push('no assessment assigned, so the player could not be assessed');
  }

  return warnings;
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
      // Every active group is offered, full ones included. A move is a
      // deliberate act by an admin, so an unsuitable target is warned about
      // rather than hidden - hiding it just looks like the group is missing.
      const availableForReassignment = groups.filter((group: GroupResponse) =>
        group.id !== currentGroupId &&
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
        setError('There are no other active groups to move this player to');
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
              <Dialog.Panel className="w-full max-w-md transform overflow-visible bg-background-modal border border-border rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-text-primary mb-4 flex items-center">
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
                    Move <strong className="text-text-primary">{player?.firstName} {player?.lastName}</strong> from <strong className="text-text-primary">{currentGroupName}</strong> to a new group:
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
                          <Listbox.Button className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center justify-between">
                            <span>
                              {selectedGroup 
                                ? `${selectedGroup.name} - ${selectedGroup.level} (${selectedGroup.availableSpots} spots)`
                                : 'Choose a group...'}
                            </span>
                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 mt-1 w-full bg-background-modal border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-secondary-100 cursor-pointer text-text-primary"
                              >
                                <div>
                                  <div className="font-medium">{group.name}</div>
                                  <div className="text-sm text-text-secondary">
                                    {group.level} • {group.currentPlayerCount}/{group.capacity} players
                                  </div>
                                  {fitWarnings(player, group).length > 0 && (
                                    <div className="text-xs text-accent-yellow mt-0.5">
                                      {fitWarnings(player, group).join(' · ')}
                                    </div>
                                  )}
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
                      <h3 className="mt-2 text-sm font-medium text-text-secondary">Nowhere to move them</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        There are no other active groups.
                      </p>
                    </div>
                  )}
                  
                  {selectedGroup && (() => {
                    const warnings = fitWarnings(player, selectedGroup);
                    return (
                      <div
                        className={`mt-4 rounded-lg p-3 border ${
                          warnings.length > 0
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-blue-500/20 border-blue-500/30'
                        }`}
                      >
                        <p className="text-sm text-text-primary">
                          <strong>Moving to:</strong> {selectedGroup.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {selectedGroup.level} • {selectedGroup.currentPlayerCount}/{selectedGroup.capacity} players
                        </p>
                        {warnings.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {warnings.map((warning) => (
                              <li key={warning} className="text-xs text-accent-yellow">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
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