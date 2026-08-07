"use client";

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GroupResponse } from '@/types/groups';
import { PlayerDTO } from '@/types/players';
import { groupsAPI } from '@/lib/api';

interface GroupPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupResponse | null;
  /** Something changed; the caller should re-read its groups. */
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * A group's players, with per-player and bulk actions.
 *
 * The card used to list every player inline, which stopped being usable at
 * twenty. Here they get room, a search box, and multi-select so a whole set
 * can be moved in one action instead of one at a time.
 */
export default function GroupPlayersModal({
  isOpen,
  onClose,
  group,
  onChanged,
  onError,
}: GroupPlayersModalProps) {
  const [players, setPlayers] = useState<PlayerDTO[]>([]);
  const [otherGroups, setOtherGroups] = useState<GroupResponse[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !group) return;

    setSelected([]);
    setSearch('');
    setTargetGroupId('');
    setError(null);
    setIsLoading(true);

    let cancelled = false;
    Promise.all([groupsAPI.getById(group.id), groupsAPI.getAll()])
      .then(([detail, all]) => {
        if (cancelled) return;
        setPlayers(detail.players ?? []);
        setOtherGroups(
          (all as GroupResponse[]).filter(g => g.id !== group.id && g.isActive)
        );
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load this group\'s players');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, group]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p =>
      `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase().includes(q)
    );
  }, [players, search]);

  const allVisibleSelected =
    visible.length > 0 && visible.every(p => selected.includes(p.id!));

  const toggle = (id: number) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const toggleAllVisible = () =>
    setSelected(prev =>
      allVisibleSelected
        ? prev.filter(id => !visible.some(p => p.id === id))
        : [...new Set([...prev, ...visible.map(p => p.id!)])]
    );

  const ageOf = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  /** targetId null removes the players from the group entirely. */
  const applyMove = async (playerIds: number[], targetId: number | null) => {
    if (!group || playerIds.length === 0) return;

    const target = targetId ? otherGroups.find(g => g.id === targetId) : null;
    const what = playerIds.length === 1 ? 'player' : `${playerIds.length} players`;

    if (!targetId && !confirm(`Remove ${what} from ${group.name}? They will have no group.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await groupsAPI.movePlayers(group.id, { playerIds, targetGroupId: targetId });
      setPlayers(prev => prev.filter(p => !playerIds.includes(p.id!)));
      setSelected(prev => prev.filter(id => !playerIds.includes(id)));
      onChanged(
        target
          ? `${what} moved to ${target.name}`
          : `${what} removed from ${group.name}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move the players';
      setError(message);
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

  const selectedCount = selected.length;

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
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-text-primary">
                      Players in {group.name}
                    </Dialog.Title>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {players.length} of {group.capacity}
                      {players.length > group.capacity && ' — over the limit'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                {players.length > 8 && (
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                ) : players.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-12">
                    No players in this group yet.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                        <span className="text-xs text-text-secondary">
                          {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
                        </span>
                      </label>
                      {search && (
                        <span className="text-xs text-text-secondary">
                          {visible.length} of {players.length} shown
                        </span>
                      )}
                    </div>

                    <div className="border border-border rounded-lg divide-y divide-border max-h-80 overflow-y-auto">
                      {visible.length === 0 ? (
                        <p className="text-sm text-text-secondary text-center py-8">
                          No players match your search.
                        </p>
                      ) : (
                        visible.map(player => {
                          const age = ageOf(player.dateOfBirth);
                          const isSelected = selected.includes(player.id!);
                          return (
                            <div
                              key={player.id}
                              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                                isSelected ? 'bg-blue-500/10' : 'hover:bg-secondary-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggle(player.id!)}
                                className="h-4 w-4 rounded text-blue-600 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">
                                  {player.firstName} {player.lastName}
                                </p>
                                <p className="text-xs text-text-secondary">
                                  {age !== null && `Age ${age}`}
                                  {player.level ? `${age !== null ? ' • ' : ''}${player.level}` : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => applyMove([player.id!], null)}
                                disabled={isSubmitting}
                                className="btn-destructive btn-xs flex-shrink-0 disabled:opacity-50"
                                title={`Remove from ${group.name}`}
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {/* Bulk bar, only once something is selected */}
                {selectedCount > 0 && (
                  <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 space-y-3">
                    <p className="text-sm text-text-primary">
                      {selectedCount} player{selectedCount === 1 ? '' : 's'} selected
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={targetGroupId}
                        onChange={e => setTargetGroupId(e.target.value)}
                        className="select-base flex-1"
                      >
                        <option value="">Move to...</option>
                        {otherGroups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.currentPlayerCount}/{g.capacity})
                            {g.isFull ? ' — full' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!targetGroupId || isSubmitting}
                        onClick={() => applyMove(selected, Number(targetGroupId))}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => applyMove(selected, null)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-accent-red text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Remove from group
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary">
                      A full destination is still offered; moving into one puts it over its limit.
                    </p>
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
