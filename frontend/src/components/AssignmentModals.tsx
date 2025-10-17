"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO } from '@/types/players';
import { UserResponse } from '@/types/users';
import { GroupResponse } from '@/types/groups';
import { playersAPI, usersAPI, groupsAPI } from '@/lib/api';

// Helper function to sort groups consistently
const sortGroups = (groups: GroupResponse[]): GroupResponse[] => {
  return [...groups].sort((a, b) => {
    // First sort by name (alphabetical)
    const nameComparison = a.name.localeCompare(b.name);
    if (nameComparison !== 0) return nameComparison;
    
    // If names are the same, sort by ID for consistency
    return a.id - b.id;
  });
};

// Player Assignment Modal
interface PlayerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: number;
  selectedGroup?: GroupResponse;
  selectedPlayer?: PlayerDTO;
  playerPreSelected?: boolean;
  onAssignmentComplete?: (playerId: number, groupId: number) => void;
}

export function PlayerAssignmentModal({ 
  isOpen, 
  onClose, 
  groupId, 
  selectedGroup,
  selectedPlayer: preSelectedPlayer,
  playerPreSelected = false,
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
      console.log('PlayerAssignmentModal opened with:', { groupId, selectedGroup, preSelectedPlayer, playerPreSelected });
      loadData();
      // Set initial selected group if provided
      if (selectedGroup) {
        setSelectedGroup_(selectedGroup);
      }
      // Set initial selected player if provided
      if (preSelectedPlayer) {
        setSelectedPlayer(preSelectedPlayer);
      }
    } else {
      // Reset state when modal closes
      setSelectedPlayer(null);
      setError(null);
      setUnassignedPlayers([]);
      setAvailableGroups([]);
    }
  }, [isOpen, selectedGroup, preSelectedPlayer]);

  const loadData = async () => {
    console.log('Loading player assignment data...');
    setLoading(true);
    setError(null);
    
    try {
      const [unassignedResponse, groupsResponse] = await Promise.all([
        playersAPI.getUnassigned(),
        // If we have a specific groupId, get all groups; otherwise get available ones
        groupId ? groupsAPI.getAll() : groupsAPI.getAvailable()
      ]);
      
      console.log('Player assignment data loaded:', {
        unassignedPlayers: unassignedResponse.length,
        availableGroups: groupsResponse.length
      });
      setUnassignedPlayers(unassignedResponse);
      
      // If targeting a specific group, ensure it's available for selection
      if (groupId && !selectedGroup) {
        const group = groupsResponse.find((g: GroupResponse) => g.id === groupId);
        console.log('Pre-selecting group for player assignment:', { groupId, group, found: !!group });
        setSelectedGroup_(group || null);
        // Always include all groups when targeting specific group
        setAvailableGroups(sortGroups(groupsResponse));
      } else {
        // For general assignment, only show available groups (not full)
        const availableGroups = groupsResponse.filter((g: GroupResponse) => !g.isFull);
        console.log('Available groups for player assignment:', availableGroups.length, 'of', groupsResponse.length);
        setAvailableGroups(sortGroups(availableGroups));
      }
    } catch (err) {
      console.error('Failed to load player assignment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedPlayer || !selectedGroup_) {
      console.log('Assignment failed: Missing player or group', { selectedPlayer, selectedGroup_ });
      return;
    }
    
    console.log('Starting player assignment:', {
      playerId: selectedPlayer.id,
      groupId: selectedGroup_.id,
      playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
      groupName: selectedGroup_.name,
      assignmentPayload: {
        playerId: selectedPlayer.id!,
        groupId: selectedGroup_.id
      }
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const assignmentPayload = {
        playerId: selectedPlayer.id!,
        groupId: selectedGroup_.id
      };
      console.log('Sending player assignment request:', assignmentPayload);
      
      const result = await groupsAPI.assignPlayer(assignmentPayload);
      
      console.log('Player assignment successful:', result);
      
      // Add a small delay to ensure backend has processed the assignment
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify the assignment was successful by checking the result
      if (!result) {
        console.warn('Player assignment API returned null/undefined result');
        setError('Assignment may not have been completed. Please verify and try again if needed.');
      }
      
      // Let the parent component handle closing after data refresh
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedPlayer.id!, selectedGroup_.id);
      } else {
        // Only close ourselves if no callback is provided
        handleClose();
      }
    } catch (err) {
      console.error('Player assignment failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Assignment failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    try {
      await playersAPI.autoAssignGroup(selectedPlayer.id!);
      
      // Let the parent component handle closing after data refresh
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedPlayer.id!, -1); // -1 indicates auto-assignment
      } else {
        // Only close ourselves if no callback is provided
        handleClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-assignment failed');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSelectedPlayer(null);
    setSelectedGroup_(selectedGroup || null);
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
                <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
                  Assign Player to Group
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Player Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {playerPreSelected ? 'Selected Player' : `Select Player (${unassignedPlayers.length} available)`}
                    </label>
                    
                    {playerPreSelected ? (
                      // Show pre-selected player as disabled field
                      <div className="w-full px-3 py-2 bg-secondary-50 border border-border rounded-lg text-text-primary flex items-center justify-between">
                        <span>
                          {selectedPlayer 
                            ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}${selectedPlayer.level ? ` - ${selectedPlayer.level}` : ''}` 
                            : 'No player selected'}
                        </span>
                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      // Show normal dropdown for player selection
                      <Listbox 
                        value={selectedPlayer} 
                        onChange={setSelectedPlayer}
                      >
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 flex items-center justify-between">
                            <span>
                              {selectedPlayer 
                                ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}${selectedPlayer.level ? ` - ${selectedPlayer.level}` : ''}` 
                                : 'Choose a player...'}
                            </span>
                            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 mt-1 w-full bg-background-modal border border-border border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {unassignedPlayers.length === 0 ? (
                              <div className="px-3 py-2 text-text-secondary text-sm">
                                No unassigned players available
                              </div>
                            ) : (
                              unassignedPlayers.map((player) => (
                                <Listbox.Option
                                  key={player.id}
                                  value={player}
                                  className="px-3 py-2 hover:bg-background cursor-pointer text-text-primary"
                                >
                                  {player.firstName} {player.lastName} {player.level ? `- ${player.level}` : ''}
                                </Listbox.Option>
                              ))
                            )}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    )}
                  </div>

                  {/* Group Selection */}
                  {!groupId && !selectedGroup && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Select Group
                      </label>
                      <Listbox value={selectedGroup_} onChange={setSelectedGroup_}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {selectedGroup_ ? selectedGroup_.name : 'Choose a group...'}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 mt-1 w-full bg-background-modal border border-border border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-background cursor-pointer text-text-primary"
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
                      <p className="text-sm text-text-primary">
                        <strong>Target Group:</strong> {selectedGroup_.name}
                      </p>
                      <p className="text-xs text-text-secondary">
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
                    className="btn-secondary btn-md flex-1"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    disabled={!selectedPlayer || loading}
                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-text-primary transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Auto Assign'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedPlayer || !selectedGroup_ || loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-text-primary transition-colors duration-200 disabled:opacity-50"
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
  
  // Debug render
  console.log('CoachAssignmentModal render:', { 
    isOpen, 
    groupId, 
    selectedGroup: selectedGroup?.name,
    propsReceivedAt: Date.now() 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCoaches, setAvailableCoaches] = useState<UserResponse[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<UserResponse | null>(null);
  const [availableGroups, setAvailableGroups] = useState<GroupResponse[]>([]);
  const [selectedGroup_, setSelectedGroup_] = useState<GroupResponse | null>(selectedGroup || null);

  // Load available coaches and groups
  useEffect(() => {
    if (isOpen) {
      console.log('Coach assignment modal opened:', { groupId, selectedGroup });
      loadData();
      // Set initial selected group if provided
      if (selectedGroup) {
        setSelectedGroup_(selectedGroup);
      }
    } else {
      // Reset state when modal closes
      setSelectedCoach(null);
      setError(null);
      setAvailableCoaches([]);
      setAvailableGroups([]);
    }
  }, [isOpen, selectedGroup]);

  // Debug state changes
  useEffect(() => {
    console.log('Coach assignment modal state:', {
      selectedCoach: selectedCoach?.firstName + ' ' + selectedCoach?.lastName,
      selectedGroup: selectedGroup_?.name,
      loading,
      buttonDisabled: !selectedCoach || !selectedGroup_ || loading,
      availableCoaches: availableCoaches.length,
      availableGroups: availableGroups.length
    });
  }, [selectedCoach, selectedGroup_, loading, availableCoaches, availableGroups]);

  const loadData = async () => {
    console.log('Loading coach assignment data...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Making API calls for coach assignment...');
      const [coachesResponse, groupsResponse] = await Promise.all([
        usersAPI.getAvailableCoaches(),
        groupsAPI.getAll()
      ]);
      
      console.log('Coach assignment data loaded:', {
        availableCoaches: coachesResponse.length,
        allGroups: groupsResponse.length,
        coachesResponse: coachesResponse.slice(0, 3), // Log first 3 for debugging
        groupsResponse: groupsResponse.slice(0, 3) // Log first 3 for debugging
      });
      
      console.log('Setting available coaches:', coachesResponse.length);
      setAvailableCoaches(coachesResponse);
      
      // If we have a specific groupId, we want to assign to that group regardless of coach status
      if (groupId && !selectedGroup) {
        const group = groupsResponse.find((g: GroupResponse) => g.id === groupId);
        console.log('Pre-selecting group for coach assignment:', { groupId, group, found: !!group });
        setSelectedGroup_(group || null);
        // When targeting a specific group, show all groups for context but preselect the target
        console.log('Setting all groups as available:', groupsResponse.length);
        setAvailableGroups(sortGroups(groupsResponse));
      } else {
        // When not targeting a specific group, only show groups without coaches
        const groupsWithoutCoaches = groupsResponse.filter((g: GroupResponse) => !g.coach);
        console.log('Groups without coaches:', groupsWithoutCoaches.length);
        setAvailableGroups(sortGroups(groupsWithoutCoaches));
      }
    } catch (err) {
      console.error('Failed to load coach assignment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedCoach || !selectedGroup_) {
      console.log('Coach assignment failed: Missing coach or group', { selectedCoach, selectedGroup_ });
      return;
    }
    
    console.log('Starting coach assignment:', {
      coachId: selectedCoach.id,
      groupId: selectedGroup_.id,
      coachName: `${selectedCoach.firstName} ${selectedCoach.lastName}`,
      groupName: selectedGroup_.name
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const assignmentData = {
        coachId: selectedCoach.id,
        groupId: selectedGroup_.id
      };
      console.log('Sending coach assignment request:', assignmentData);
      
      const result = await groupsAPI.assignCoach(assignmentData);
      
      console.log('Coach assignment successful:', result);
      
      // Add a small delay to ensure backend has processed the assignment
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify the assignment was successful by checking the result
      if (!result) {
        console.warn('Coach assignment API returned null/undefined result');
      }
      
      // Let the parent component handle closing after data refresh
      if (onAssignmentComplete) {
        onAssignmentComplete(selectedCoach.id, selectedGroup_.id);
      } else {
        // Only close ourselves if no callback is provided
        handleClose();
      }
    } catch (err) {
      console.error('Coach assignment failed:', err);
      console.error('Error details:', {
        errorType: typeof err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : null,
        coachId: selectedCoach.id,
        groupId: selectedGroup_.id
      });
      const errorMessage = err instanceof Error ? err.message : 'Assignment failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCoach(null);
    setSelectedGroup_(selectedGroup || null);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-text-primary mb-4">
                  Assign Coach to Group
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Coach Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Select Coach
                    </label>
                    <Listbox 
                      value={selectedCoach} 
                      onChange={(coach) => {
                        console.log('Coach selected:', coach);
                        setSelectedCoach(coach);
                      }}
                    >
                      <div className="relative">
                        <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                          {selectedCoach ? selectedCoach.firstName + ' ' + selectedCoach.lastName : 'Choose a coach...'}
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-background-modal border border-border border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                          {availableCoaches.map((coach) => (
                            <Listbox.Option
                              key={coach.id}
                              value={coach}
                              className="px-3 py-2 hover:bg-background cursor-pointer text-text-primary"
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
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Select Group
                      </label>
                      <Listbox value={selectedGroup_} onChange={setSelectedGroup_}>
                        <div className="relative">
                          <Listbox.Button className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {selectedGroup_ ? selectedGroup_.name : 'Choose a group...'}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-50 mt-1 w-full bg-background-modal border border-border border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-auto">
                            {availableGroups.map((group) => (
                              <Listbox.Option
                                key={group.id}
                                value={group}
                                className="px-3 py-2 hover:bg-background cursor-pointer text-text-primary"
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
                      <p className="text-sm text-text-primary">
                        <strong>Target Group:</strong> {selectedGroup_.name}
                      </p>
                      <p className="text-xs text-text-secondary">
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
                    className="btn-secondary btn-md flex-1"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={!selectedCoach || !selectedGroup_ || loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-text-primary transition-colors duration-200 disabled:opacity-50"
                    title={`Coach: ${selectedCoach ? 'Selected' : 'Not selected'}, Group: ${selectedGroup_ ? 'Selected' : 'Not selected'}, Loading: ${loading}`}
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