"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO } from '@/types/players';
import { UserResponse } from '@/types/users';
import { GroupResponse } from '@/types/groups';
import { playersAPI, usersAPI, groupsAPI } from '@/lib/api';

// Player Assignment Modal
interface PlayerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: number;
  selectedGroup?: GroupResponse;
  onAssignmentComplete?: (playerId: number, groupId: number) => void;
}

export function PlayerAssignmentModal({ 
  isOpen, 
  onClose, 
  groupId, 
  selectedGroup,
  onAssignmentComplete 
}: PlayerAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unassignedPlayers, setUnassignedPlayers] = useState<PlayerDTO[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDTO | null>(null);
  const [availableGroups, setAvailableGroups] = useState<GroupResponse[]>([]);
  const [selectedGroup_, setSelectedGroup_] = useState<GroupResponse | null>(selectedGroup || null);

  // Load unassigned players and available groups
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [unassignedResponse, groupsResponse] = await Promise.all([
        playersAPI.getUnassigned(),
        groupsAPI.getAvailable()
      ]);
      
      setUnassignedPlayers(unassignedResponse);
      setAvailableGroups(groupsResponse);
      
      if (groupId && !selectedGroup) {
        const group = groupsResponse.find(g => g.id === groupId);
        setSelectedGroup_(group || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedPlayer || !selectedGroup_) return;
    
    setLoading(true);
    try {
      await groupsAPI.assignPlayer({
        playerId: selectedPlayer.id!,
        groupId: selectedGroup_.id
      });
      
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedPlayer.id!, selectedGroup_.id);
      }
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    }
    setLoading(false);
  };

  const handleAutoAssign = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    try {
      await playersAPI.autoAssignGroup(selectedPlayer.id!);
      
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedPlayer.id!, -1); // -1 indicates auto-assignment
      }
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-assignment failed');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSelectedPlayer(null);
    setError(null);
    if (!groupId && !selectedGroup) {
      setSelectedGroup_(null);
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-white mb-4">
                  Assign Player to Group
                </Dialog.Title>

                {error && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Player Selection */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Select Player
                    </label>
                    <Listbox value={selectedPlayer} onChange={setSelectedPlayer}>
                      <div className="relative">
                        <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                          {selectedPlayer ? selectedPlayer.firstName + ' ' + selectedPlayer.lastName : 'Choose a player...'}
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                          {unassignedPlayers.map((player) => (
                            <Listbox.Option
                              key={player.id}
                              value={player}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                            >
                              {player.firstName} {player.lastName} - {player.level}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {/* Group Selection */}
                  {!groupId && !selectedGroup && (
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Select Group
                      </label>
                      <Listbox value={selectedGroup_} onChange={setSelectedGroup_}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {selectedGroup_ ? selectedGroup_.name : 'Choose a group...'}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                              >
                                {group.name} - {group.level} ({group.availableSpots} spots)
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  )}

                  {selectedGroup_ && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-200">
                        <strong>Target Group:</strong> {selectedGroup_.name}
                      </p>
                      <p className="text-xs text-blue-300">
                        {selectedGroup_.level} • {selectedGroup_.availableSpots} spots available
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    disabled={!selectedPlayer || loading}
                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Auto Assign'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedPlayer || !selectedGroup_ || loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign'}
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

// Coach Assignment Modal
interface CoachAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: number;
  selectedGroup?: GroupResponse;
  onAssignmentComplete?: (coachId: number, groupId: number) => void;
}

export function CoachAssignmentModal({ 
  isOpen, 
  onClose, 
  groupId, 
  selectedGroup,
  onAssignmentComplete 
}: CoachAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCoaches, setAvailableCoaches] = useState<UserResponse[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<UserResponse | null>(null);
  const [availableGroups, setAvailableGroups] = useState<GroupResponse[]>([]);
  const [selectedGroup_, setSelectedGroup_] = useState<GroupResponse | null>(selectedGroup || null);

  // Load available coaches and groups
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coachesResponse, groupsResponse] = await Promise.all([
        usersAPI.getAvailableCoaches(),
        groupsAPI.getAll()
      ]);
      
      setAvailableCoaches(coachesResponse);
      // Filter groups without coaches
      setAvailableGroups(groupsResponse.filter((g: GroupResponse) => !g.coach));
      
      if (groupId && !selectedGroup) {
        const group = groupsResponse.find((g: GroupResponse) => g.id === groupId);
        setSelectedGroup_(group || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedCoach || !selectedGroup_) return;
    
    setLoading(true);
    try {
      await groupsAPI.assignCoach({
        coachId: selectedCoach.id,
        groupId: selectedGroup_.id
      });
      
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedCoach.id, selectedGroup_.id);
      }
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSelectedCoach(null);
    setError(null);
    if (!groupId && !selectedGroup) {
      setSelectedGroup_(null);
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-white mb-4">
                  Assign Coach to Group
                </Dialog.Title>

                {error && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-3">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Coach Selection */}
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Select Coach
                    </label>
                    <Listbox value={selectedCoach} onChange={setSelectedCoach}>
                      <div className="relative">
                        <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                          {selectedCoach ? selectedCoach.firstName + ' ' + selectedCoach.lastName : 'Choose a coach...'}
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                          {availableCoaches.map((coach) => (
                            <Listbox.Option
                              key={coach.id}
                              value={coach}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                            >
                              {coach.firstName} {coach.lastName}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {/* Group Selection */}
                  {!groupId && !selectedGroup && (
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Select Group
                      </label>
                      <Listbox value={selectedGroup_} onChange={setSelectedGroup_}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {selectedGroup_ ? selectedGroup_.name : 'Choose a group...'}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                              >
                                {group.name} - {group.level}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  )}

                  {selectedGroup_ && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-200">
                        <strong>Target Group:</strong> {selectedGroup_.name}
                      </p>
                      <p className="text-xs text-blue-300">
                        {selectedGroup_.level} • {selectedGroup_.currentPlayerCount} players
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedCoach || !selectedGroup_ || loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign Coach'}
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