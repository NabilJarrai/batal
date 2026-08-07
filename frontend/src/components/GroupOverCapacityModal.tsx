"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GroupResponse } from '@/types/groups';
import { PlayerDTO } from '@/types/players';
import { groupsAPI } from '@/lib/api';

interface GroupOverCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The group that is already at its limit. */
  group: GroupResponse | null;
  /** The player whose assignment hit the limit. */
  player: PlayerDTO | null;
  /** Called once the player has been placed, either way. */
  onComplete: (message: string) => void;
  onError: (message: string) => void;
}

type Choice = 'add' | 'split';

/**
 * Offered when a player is assigned to a group that is already at its limit.
 *
 * The limit is a threshold, not a hard rule, so going over stays possible -
 * but only as a deliberate choice, never silently.
 */
export default function GroupOverCapacityModal({
  isOpen,
  onClose,
  group,
  player,
  onComplete,
  onError,
}: GroupOverCapacityModalProps) {
  const [choice, setChoice] = useState<Choice>('split');
  const [newGroupName, setNewGroupName] = useState('');
  const [playerIdsToMove, setPlayerIdsToMove] = useState<number[]>([]);
  const [newPlayerJoinsNewGroup, setNewPlayerJoinsNewGroup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Fetched fresh: the group list does not reliably carry its players, and the
   * picker needs them. getById loads players and coach explicitly.
   */
  const [detail, setDetail] = useState<GroupResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isOpen || !group) return;

    setChoice('split');
    setNewGroupName(`${group.name} B`);
    setPlayerIdsToMove([]);
    setNewPlayerJoinsNewGroup(true);
    setError(null);
    setDetail(null);

    let cancelled = false;
    setIsLoadingDetail(true);
    groupsAPI
      .getById(group.id)
      .then(full => {
        if (!cancelled) setDetail(full);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this group\'s players.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, group]);

  const existingPlayers = detail?.players ?? group?.players ?? [];

  const togglePlayer = (playerId: number) => {
    setPlayerIdsToMove(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleAddAnyway = async () => {
    if (!group || !player?.id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await groupsAPI.assignPlayer({
        playerId: player.id,
        groupId: group.id,
        // The limit was shown and the admin chose to go past it.
        forceAssignment: true,
        reason: 'Added over capacity by admin',
      });
      onComplete(
        `${player.firstName} ${player.lastName} added to ${group.name}, now over its limit of ${group.capacity}`
      );
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add the player';
      setError(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSplit = async () => {
    if (!group || !player?.id) return;

    if (!newGroupName.trim()) {
      setError('Give the new group a name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await groupsAPI.split(group.id, {
        newGroupName: newGroupName.trim(),
        playerIdsToMove,
        newPlayerId: player.id,
        newPlayerJoinsNewGroup,
      });

      const landedIn = newPlayerJoinsNewGroup ? result.newGroup.name : result.originalGroup.name;
      onComplete(
        `${result.newGroup.name} created with ${result.playersMoved} player${
          result.playersMoved === 1 ? '' : 's'
        } moved across. ${player.firstName} ${player.lastName} joined ${landedIn}.`
      );
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to split the group';
      setError(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group || !player) return null;

  // From currentPlayerCount, not the loaded list: the count is authoritative
  // and correct even while the player list is still loading.
  const remainingInOriginal =
    group.currentPlayerCount - playerIdsToMove.length + (newPlayerJoinsNewGroup ? 0 : 1);
  const countInNew = playerIdsToMove.length + (newPlayerJoinsNewGroup ? 1 : 0);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-1">
                  {group.name} is full
                </Dialog.Title>
                <p className="text-sm text-text-secondary mb-4">
                  It already has {group.currentPlayerCount} of {group.capacity} players. Choose
                  where {player.firstName} {player.lastName} should go.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      choice === 'split'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={choice === 'split'}
                      onChange={() => setChoice('split')}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-text-primary">
                        Create a new group
                      </span>
                      <span className="block text-xs text-text-secondary">
                        Takes the same level, age group and assessment. Pick who moves across.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      choice === 'add'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={choice === 'add'}
                      onChange={() => setChoice('add')}
                      className="mt-1 h-4 w-4 text-blue-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-text-primary">
                        Add to {group.name} anyway
                      </span>
                      <span className="block text-xs text-text-secondary">
                        Puts the group at {group.currentPlayerCount + 1} of {group.capacity}.
                      </span>
                    </span>
                  </label>
                </div>

                {choice === 'split' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        New group name *
                      </label>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Development Cookies B"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Where does {player.firstName} go?
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewPlayerJoinsNewGroup(true)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            newPlayerJoinsNewGroup
                              ? 'bg-primary text-white'
                              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
                          }`}
                        >
                          The new group
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlayerJoinsNewGroup(false)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            !newPlayerJoinsNewGroup
                              ? 'bg-primary text-white'
                              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
                          }`}
                        >
                          {group.name}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-text-secondary">
                          Move players across ({playerIdsToMove.length} selected)
                        </label>
                        {existingPlayers.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPlayerIdsToMove(
                                playerIdsToMove.length === existingPlayers.length
                                  ? []
                                  : existingPlayers.map(p => p.id!).filter(Boolean)
                              )
                            }
                            className="text-xs text-primary hover:text-primary-hover transition-colors"
                          >
                            {playerIdsToMove.length === existingPlayers.length
                              ? 'Clear all'
                              : 'Select all'}
                          </button>
                        )}
                      </div>

                      {isLoadingDetail ? (
                        <div className="flex items-center gap-2 py-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                          <span className="text-xs text-text-secondary">Loading players...</span>
                        </div>
                      ) : existingPlayers.length === 0 ? (
                        <p className="text-xs text-text-secondary">
                          No players to move. The new group will still be created.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto border border-border rounded-lg p-2">
                          {existingPlayers.map(existing => (
                            <label
                              key={existing.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-secondary cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={playerIdsToMove.includes(existing.id!)}
                                onChange={() => togglePlayer(existing.id!)}
                                className="h-4 w-4 rounded text-blue-600"
                              />
                              <span className="text-sm text-text-primary truncate">
                                {existing.firstName} {existing.lastName}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-text-secondary">
                        Afterwards: <span className="text-text-primary">{group.name}</span> has{' '}
                        {remainingInOriginal} of {group.capacity}, and{' '}
                        <span className="text-text-primary">{newGroupName || 'the new group'}</span>{' '}
                        has {countInNew} of {group.capacity}. The new group starts without a coach.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={choice === 'split' ? handleSplit : handleAddAnyway}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary font-medium transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Working...'
                      : choice === 'split'
                        ? 'Create group and move'
                        : 'Add anyway'}
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
