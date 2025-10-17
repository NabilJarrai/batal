"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { AssignmentService } from '@/services/assignmentService';
import { PlayerDTO } from '@/types/players';
import { GroupResponse } from '@/types/groups';
import { apiClient } from '@/lib/apiClient';
import { playersAPI } from '@/lib/api';

interface AutoAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  refreshTrigger?: number; // Optional prop to trigger refresh when data changes
}

export default function AutoAssignmentModal({ 
  isOpen, 
  onClose, 
  onComplete,
  refreshTrigger 
}: AutoAssignmentModalProps) {
  const [unassignedPlayers, setUnassignedPlayers] = useState<PlayerDTO[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [assignAll, setAssignAll] = useState(false);
  const [results, setResults] = useState<{
    success: string[];
    failed: string[];
  } | null>(null);
  const [recommendations, setRecommendations] = useState<Map<number, GroupResponse[]>>(new Map());

  useEffect(() => {
    if (isOpen) {
      loadUnassignedPlayers();
    }
  }, [isOpen, refreshTrigger]);

  useEffect(() => {
    if (assignAll) {
      setSelectedPlayers(new Set(unassignedPlayers.map(p => p.id!)));
    } else {
      setSelectedPlayers(new Set());
    }
  }, [assignAll, unassignedPlayers]);

  const loadUnassignedPlayers = async () => {
    try {
      console.log('Loading unassigned players for auto-assignment...');
      const unassignedPlayers = await playersAPI.getUnassigned();
      console.log('Unassigned players loaded:', unassignedPlayers.length);
      setUnassignedPlayers(unassignedPlayers);

      // Load recommendations for each player
      const recMap = new Map<number, GroupResponse[]>();
      for (const player of unassignedPlayers) {
        try {
          const recs = await AssignmentService.getRecommendations(player);
          recMap.set(player.id!, recs);
        } catch (recError) {
          console.warn(`Failed to get recommendations for player ${player.firstName} ${player.lastName}:`, recError);
          recMap.set(player.id!, []); // Set empty recommendations on error
        }
      }
      setRecommendations(recMap);
      console.log('Recommendations loaded for', recMap.size, 'players');
    } catch (error) {
      console.error('Failed to load unassigned players:', error);
      setUnassignedPlayers([]); // Set empty array on error to prevent infinite loading
    }
  };

  const handleAutoAssign = async () => {
    setIsProcessing(true);
    const success: string[] = [];
    const failed: string[] = [];

    const playersToAssign = unassignedPlayers.filter(p => selectedPlayers.has(p.id!));

    for (const player of playersToAssign) {
      try {
        console.log(`Auto-assigning player ${player.firstName} ${player.lastName} (ID: ${player.id})`);
        const result = await playersAPI.autoAssignGroup(player.id!);
        console.log(`Auto-assignment result for ${player.firstName}:`, result);
        
        if (result && result.groupName) {
          success.push(`${player.firstName} ${player.lastName} → ${result.groupName}`);
        } else {
          console.warn(`Auto-assignment returned unexpected result for ${player.firstName}:`, result);
          failed.push(`${player.firstName} ${player.lastName}`);
        }
      } catch (error) {
        console.error(`Failed to auto-assign ${player.firstName} ${player.lastName}:`, error);
        let errorMessage = 'Unknown error';
        
        // Handle different error types
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = (error as any).message;
        } else if (typeof error === 'object' && error !== null && 'error' in error) {
          // Handle backend error response format
          errorMessage = (error as any).error + ': ' + ((error as any).message || '');
        }
        
        failed.push(`${player.firstName} ${player.lastName} (${errorMessage})`);
      }
    }

    setResults({ success, failed });
    setIsProcessing(false);
    
    if (success.length > 0) {
      setTimeout(() => {
        onComplete();
        handleClose();
      }, 2000);
    }
  };

  const togglePlayerSelection = (playerId: number) => {
    const newSelection = new Set(selectedPlayers);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else {
      newSelection.add(playerId);
    }
    setSelectedPlayers(newSelection);
    setAssignAll(false);
  };

  const handleClose = () => {
    setSelectedPlayers(new Set());
    setAssignAll(false);
    setResults(null);
    onClose();
  };

  const getAgeGroupColor = (player: PlayerDTO) => {
    if (!player.dateOfBirth) return 'bg-gray-500';
    const ageGroup = AssignmentService.getAgeGroup(player.dateOfBirth);
    switch (ageGroup) {
      case 'COOKIES': return 'bg-yellow-500';
      case 'DOLPHINS': return 'bg-blue-500';
      case 'TIGERS': return 'bg-orange-500';
      case 'LIONS': return 'bg-red-500';
      default: return 'bg-gray-500';
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-white mb-4">
                  Auto-Assign Unassigned Players
                </Dialog.Title>

                {!results ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div>
                          <p className="text-sm text-text-secondary">
                            {unassignedPlayers.length} unassigned active players found
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            Players will be assigned based on age group and level
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-text-secondary">Assign All</span>
                          <Switch
                            checked={assignAll}
                            onChange={setAssignAll}
                            className={`${
                              assignAll ? 'bg-blue-600' : 'bg-gray-600'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                          >
                            <span className="sr-only">Assign all players</span>
                            <span
                              className={`${
                                assignAll ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </Switch>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
                      {unassignedPlayers.map((player) => {
                        const playerRecs = recommendations.get(player.id!) || [];
                        return (
                          <div
                            key={player.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              selectedPlayers.has(player.id!)
                                ? 'bg-blue-500/20 border-blue-500/40'
                                : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                            }`}
                            onClick={() => togglePlayerSelection(player.id!)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedPlayers.has(player.id!)}
                                  onChange={() => {}}
                                  className="h-4 w-4 rounded text-blue-600"
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white font-medium">
                                      {player.firstName} {player.lastName}
                                    </span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getAgeGroupColor(player)}`}>
                                      {player.dateOfBirth && AssignmentService.getAgeGroup(player.dateOfBirth)}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs bg-purple-500 rounded-full text-white">
                                      {player.level}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-secondary">
                                    {player.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {playerRecs.length > 0 ? (
                                  <div>
                                    <p className="text-xs text-accent-teal">
                                      Recommended: {playerRecs[0].name}
                                    </p>
                                    {playerRecs.length > 1 && (
                                      <p className="text-xs text-text-secondary">
                                        +{playerRecs.length - 1} alternatives
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-accent-red">No available groups</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-sm text-text-secondary">
                        {selectedPlayers.size} players selected
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAutoAssign}
                          disabled={selectedPlayers.size === 0 || isProcessing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Assigning...' : `Auto-Assign ${selectedPlayers.size} Player${selectedPlayers.size !== 1 ? 's' : ''}`}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {results.success.length > 0 && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <h4 className="text-accent-teal font-medium mb-2">
                          Successfully Assigned ({results.success.length})
                        </h4>
                        <ul className="text-sm text-accent-teal space-y-1">
                          {results.success.map((msg, idx) => (
                            <li key={idx}>✓ {msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.failed.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <h4 className="text-accent-red font-medium mb-2">
                          Failed to Assign ({results.failed.length})
                        </h4>
                        <ul className="text-sm text-accent-red space-y-1">
                          {results.failed.map((msg, idx) => (
                            <li key={idx}>✗ {msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}