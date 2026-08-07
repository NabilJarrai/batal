"use client";

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, PlayerCreateRequest, Level, BasicFoot } from '@/types/players';
import { UserResponse } from '@/types/users';
import { playersAPI, usersAPI } from '@/lib/api';
import { AssignmentService } from '@/services/assignmentService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (players: PlayerDTO[], parentChanged: boolean) => void;
  /**
   * When opened from a parent's card the parent is already decided, so the
   * picker is replaced by that parent's editable details.
   */
  lockedParent?: UserResponse | null;
  /**
   * 'edit' opens on an existing parent to change their details, with adding
   * players optional. 'create' requires at least one new player.
   */
  mode?: 'create' | 'edit';
}

type ParentMode = 'existing' | 'new';

interface ParentDetailsState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * The family's second guardian. Stored on the parent's account, not on each
 * player, so it survives an edit that adds no players and is not duplicated
 * across siblings.
 */
interface SecondaryParentState {
  name: string;
  email: string;
  phone: string;
}

interface PlayerDraft {
  key: number;
  firstName: string;
  lastName: string;
  /**
   * Last name is inherited from the parent until the admin types their own.
   * Once touched it stops following the parent, so a child with a different
   * surname is not silently overwritten.
   */
  lastNameTouched: boolean;
  dateOfBirth: string;
  joiningDate: string;
  basicFoot: BasicFoot;
  level: Level;
}

const emptyParentDetails: ParentDetailsState = { firstName: '', lastName: '', email: '', phone: '' };
const emptySecondaryParent: SecondaryParentState = { name: '', email: '', phone: '' };

function parentDetailsOf(parent: UserResponse): ParentDetailsState {
  return {
    firstName: parent.firstName ?? '',
    lastName: parent.lastName ?? '',
    email: parent.email ?? '',
    phone: parent.phone ?? '',
  };
}

function secondaryParentOf(parent: UserResponse): SecondaryParentState {
  return {
    name: parent.secondaryParentName ?? '',
    email: parent.secondaryParentEmail ?? '',
    phone: parent.secondaryParentPhone ?? '',
  };
}

function sameParentDetails(a: ParentDetailsState, b: ParentDetailsState): boolean {
  return a.firstName.trim() === b.firstName.trim()
    && a.lastName.trim() === b.lastName.trim()
    && a.email.trim() === b.email.trim()
    && a.phone.trim() === b.phone.trim();
}

function sameSecondaryParent(a: SecondaryParentState, b: SecondaryParentState): boolean {
  return a.name.trim() === b.name.trim()
    && a.email.trim() === b.email.trim()
    && a.phone.trim() === b.phone.trim();
}

function ageFrom(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Format as YYYY-MM-DD in local time.
 *
 * toISOString() converts to UTC first, which rolls a date picked west of
 * Greenwich back to the previous day - a birth date of the 1st arriving as
 * the 31st.
 */
function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromLocalISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

let nextPlayerKey = 1;

function makePlayerDraft(inheritedLastName: string): PlayerDraft {
  return {
    key: nextPlayerKey++,
    firstName: '',
    lastName: inheritedLastName,
    lastNameTouched: false,
    dateOfBirth: '',
    joiningDate: toLocalISODate(new Date()),
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
  };
}

export default function CreatePlayerModal({
  isOpen,
  onClose,
  onComplete,
  lockedParent = null,
  mode = 'create',
}: CreatePlayerModalProps) {
  const [parentMode, setParentMode] = useState<ParentMode>('existing');
  const [parentSearch, setParentSearch] = useState('');
  const [parentResults, setParentResults] = useState<UserResponse[]>([]);
  /** The existing parent this form is acting on, with their current children. */
  const [selectedParent, setSelectedParent] = useState<UserResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  /** Editable copy of the parent's details, for both an existing and a new parent. */
  const [parentDetails, setParentDetails] = useState<ParentDetailsState>({ ...emptyParentDetails });

  const [secondaryParent, setSecondaryParent] = useState<SecondaryParentState>({ ...emptySecondaryParent });
  const [showSecondaryParent, setShowSecondaryParent] = useState(false);

  const [players, setPlayers] = useState<PlayerDraft[]>(mode === 'edit' ? [] : [makePlayerDraft('')]);
  const [autoAssign, setAutoAssign] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = mode === 'edit';
  const existingParent = lockedParent ?? selectedParent;
  const isCreatingParent = !existingParent && parentMode === 'new';
  const attachedPlayers = existingParent?.children ?? [];

  // Load the locked parent's details in, and reset when the modal is reopened
  // on somebody else.
  useEffect(() => {
    if (!isOpen) return;
    if (lockedParent) {
      setParentDetails(parentDetailsOf(lockedParent));
      const secondary = secondaryParentOf(lockedParent);
      setSecondaryParent(secondary);
      setShowSecondaryParent(secondary.name.trim().length > 0);
      setSelectedParent(null);
    }
    setPlayers(mode === 'edit' ? [] : [makePlayerDraft(lockedParent?.lastName ?? '')]);
    setError(null);
  }, [isOpen, lockedParent, mode]);

  // The surname children inherit by default. It follows the editable field, so
  // correcting the parent's surname updates untouched children too.
  const parentLastName = useMemo(
    () => parentDetails.lastName.trim(),
    [parentDetails.lastName]
  );

  // Push the parent's surname onto every child the admin has not renamed.
  useEffect(() => {
    setPlayers(prev => prev.map(player =>
      player.lastNameTouched ? player : { ...player, lastName: parentLastName }
    ));
  }, [parentLastName]);

  // Debounced parent search.
  useEffect(() => {
    if (lockedParent || parentMode !== 'existing' || !isOpen) return;

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const query = parentSearch.trim();
        const results = await usersAPI.searchParents(query.length ? query : undefined);
        if (!cancelled) setParentResults(results);
      } catch {
        if (!cancelled) setParentResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parentSearch, parentMode, isOpen, lockedParent]);

  const resetForm = () => {
    setParentMode('existing');
    setParentSearch('');
    setParentResults([]);
    setSelectedParent(null);
    setParentDetails({ ...emptyParentDetails });
    setSecondaryParent({ ...emptySecondaryParent });
    setShowSecondaryParent(false);
    setPlayers(isEditMode ? [] : [makePlayerDraft('')]);
    setAutoAssign(true);
    setError(null);
  };

  /** Pick an existing parent and pull their details into the editable fields. */
  const chooseParent = (parent: UserResponse) => {
    setSelectedParent(parent);
    setParentDetails(parentDetailsOf(parent));
    const secondary = secondaryParentOf(parent);
    setSecondaryParent(secondary);
    setShowSecondaryParent(secondary.name.trim().length > 0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updatePlayer = (key: number, changes: Partial<PlayerDraft>) => {
    setPlayers(prev => prev.map(p => (p.key === key ? { ...p, ...changes } : p)));
  };

  const addPlayer = () => {
    setPlayers(prev => [...prev, makePlayerDraft(parentLastName)]);
  };

  const removePlayer = (key: number) => {
    setPlayers(prev => prev.filter(p => p.key !== key));
  };

  const validate = (): string | null => {
    if (!existingParent && parentMode === 'existing') {
      return 'Select the main parent, or switch to Create New to add one.';
    }

    if (!parentDetails.firstName.trim()) return 'Main parent first name is required.';
    if (!parentDetails.lastName.trim()) return 'Main parent last name is required.';
    if (!parentDetails.email.trim()) return 'Main parent email is required.';
    if (!parentDetails.phone.trim()) return 'Main parent mobile number is required.';

    if (showSecondaryParent && !secondaryParent.name.trim()
        && (secondaryParent.email.trim() || secondaryParent.phone.trim())) {
      return 'Enter a name for the secondary parent, or remove their details.';
    }

    if (players.length === 0 && !isEditMode) {
      return 'Add at least one player.';
    }

    for (const [index, player] of players.entries()) {
      const label = players.length > 1 ? `Player ${index + 1}: ` : '';
      if (!player.firstName.trim()) return `${label}first name is required.`;
      if (!player.lastName.trim()) return `${label}last name is required.`;
      if (!player.dateOfBirth) return `${label}date of birth is required.`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Belongs to the parent, so it is sent with the parent rather than with
    // each player. Sending empty strings when removed tells the backend to
    // clear the stored contact.
    const secondaryPayload = showSecondaryParent && secondaryParent.name.trim()
      ? {
          secondaryParentName: secondaryParent.name.trim(),
          secondaryParentEmail: secondaryParent.email.trim(),
          secondaryParentPhone: secondaryParent.phone.trim(),
        }
      : { secondaryParentName: '', secondaryParentEmail: '', secondaryParentPhone: '' };

    const playerPayloads: PlayerCreateRequest[] = players.map(player => ({
      firstName: player.firstName.trim(),
      lastName: player.lastName.trim(),
      dateOfBirth: player.dateOfBirth,
      joiningDate: player.joiningDate || undefined,
      basicFoot: player.basicFoot,
      level: player.level,
      isActive: true,
    }));

    try {
      let createdPlayers: PlayerDTO[] = [];
      let parentChanged = false;

      if (existingParent) {
        // Save any edits to the parent first, the secondary guardian included.
        // Skipped when nothing changed, so simply adding a player does not
        // touch the parent record.
        const currentSecondary = showSecondaryParent
          ? secondaryParent
          : { name: '', email: '', phone: '' };
        const detailsChanged = !sameParentDetails(parentDetails, parentDetailsOf(existingParent));
        const secondaryChanged = !sameSecondaryParent(currentSecondary, secondaryParentOf(existingParent));

        if (detailsChanged || secondaryChanged) {
          await usersAPI.update(existingParent.id, {
            firstName: parentDetails.firstName.trim(),
            lastName: parentDetails.lastName.trim(),
            email: parentDetails.email.trim(),
            phone: parentDetails.phone.trim(),
            ...secondaryPayload,
          });
          parentChanged = true;
        }

        if (playerPayloads.length > 0) {
          const response = await playersAPI.createWithParent({
            parentId: existingParent.id,
            players: playerPayloads,
            autoAssignGroup: autoAssign,
          });
          createdPlayers = response.players;
        }
      } else {
        const response = await playersAPI.createWithParent({
          newParent: {
            firstName: parentDetails.firstName.trim(),
            lastName: parentDetails.lastName.trim(),
            email: parentDetails.email.trim(),
            phone: parentDetails.phone.trim(),
            ...secondaryPayload,
          },
          players: playerPayloads,
          autoAssignGroup: autoAssign,
        });
        createdPlayers = response.players;
        parentChanged = true;
      }

      onComplete(createdPlayers, parentChanged);
      handleClose();
    } catch (err) {
      console.error('Error creating players:', err);
      setError(err instanceof Error ? err.message : 'Failed to create players');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1';

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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-4">
                  {isEditMode && lockedParent
                    ? `Edit ${lockedParent.firstName} ${lockedParent.lastName}`
                    : lockedParent
                      ? `Add Player for ${lockedParent.firstName} ${lockedParent.lastName}`
                      : 'Add New Player'}
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ===== MAIN PARENT ===== */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      Main Parent
                    </h4>

                    {/* Existing-or-new toggle, only when no parent is fixed yet */}
                    {!lockedParent && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setParentMode('existing');
                            setParentDetails({ ...emptyParentDetails });
                            setSecondaryParent({ ...emptySecondaryParent });
                            setShowSecondaryParent(false);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            parentMode === 'existing'
                              ? 'bg-primary text-white'
                              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
                          }`}
                        >
                          Select Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setParentMode('new');
                            setSelectedParent(null);
                            setParentDetails({ ...emptyParentDetails });
                            setSecondaryParent({ ...emptySecondaryParent });
                            setShowSecondaryParent(false);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            parentMode === 'new'
                              ? 'bg-primary text-white'
                              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
                          }`}
                        >
                          Create New
                        </button>
                      </div>
                    )}

                    {/* Search, until a parent is picked */}
                    {!lockedParent && parentMode === 'existing' && !selectedParent && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          placeholder="Search parents by name or email..."
                          className={inputClass}
                        />

                        <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                          {isSearching ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                              <span className="ml-2 text-xs text-text-secondary">Searching...</span>
                            </div>
                          ) : parentResults.length === 0 ? (
                            <p className="text-xs text-text-secondary text-center py-4">
                              {parentSearch ? 'No parents found' : 'No parents registered yet'}
                            </p>
                          ) : (
                            parentResults.map((parent) => (
                              <button
                                key={parent.id}
                                type="button"
                                onClick={() => chooseParent(parent)}
                                className="w-full px-3 py-2 text-left border-b border-border last:border-b-0 transition-colors text-sm hover:bg-secondary"
                              >
                                <span className="font-medium text-text-primary">
                                  {parent.firstName} {parent.lastName}
                                </span>
                                <span className="text-text-secondary ml-2">{parent.email}</span>
                                {parent.children && parent.children.length > 0 && (
                                  <span className="text-text-secondary ml-2">
                                    • {parent.children.length} player{parent.children.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parent details. Editable whether they already exist or not. */}
                    {(existingParent || isCreatingParent) && (
                      <div className="space-y-3">
                        {existingParent && !lockedParent && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">
                              Editing an existing parent. Saving updates their record.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParent(null);
                                setParentDetails({ ...emptyParentDetails });
                                setSecondaryParent({ ...emptySecondaryParent });
                                setShowSecondaryParent(false);
                                setParentSearch('');
                              }}
                              className="text-xs text-primary hover:text-primary-hover transition-colors"
                            >
                              Choose a different parent
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>First Name *</label>
                            <input
                              type="text"
                              value={parentDetails.firstName}
                              onChange={(e) => setParentDetails({ ...parentDetails, firstName: e.target.value })}
                              className={inputClass}
                              placeholder="Parent first name"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Last Name *</label>
                            <input
                              type="text"
                              value={parentDetails.lastName}
                              onChange={(e) => setParentDetails({ ...parentDetails, lastName: e.target.value })}
                              className={inputClass}
                              placeholder="Parent last name"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Email *</label>
                            <input
                              type="email"
                              value={parentDetails.email}
                              onChange={(e) => setParentDetails({ ...parentDetails, email: e.target.value })}
                              className={inputClass}
                              placeholder="parent@example.com"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Mobile *</label>
                            <input
                              type="tel"
                              value={parentDetails.phone}
                              onChange={(e) => setParentDetails({ ...parentDetails, phone: e.target.value })}
                              className={inputClass}
                              placeholder="+20 100 000 0000"
                            />
                          </div>
                        </div>

                        {isCreatingParent && (
                          <p className="text-xs text-text-secondary">
                            The account is created active and a password setup email is sent to this
                            address. They cannot sign in until they use that link.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Players already attached to this parent */}
                    {existingParent && (
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                          Players attached ({attachedPlayers.length})
                        </p>
                        {attachedPlayers.length === 0 ? (
                          <p className="text-xs text-text-secondary">
                            No players yet. Add one below.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {attachedPlayers.map((child) => {
                              const age = ageFrom(child.dateOfBirth);
                              return (
                                <div
                                  key={child.id}
                                  className="flex items-center justify-between text-sm bg-background/50 rounded px-2 py-1.5"
                                >
                                  <span className="text-text-primary">
                                    {child.firstName} {child.lastName}
                                  </span>
                                  <span className="text-xs text-text-secondary">
                                    {age !== null && `Age ${age}`}
                                    {child.groupName ? ` • ${child.groupName}` : ''}
                                    {child.level ? ` • ${child.level}` : ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ===== SECONDARY PARENT ===== */}
                  <div className="border-t border-border pt-4">
                    {!showSecondaryParent ? (
                      <button
                        type="button"
                        onClick={() => setShowSecondaryParent(true)}
                        className="text-sm text-primary hover:text-primary-hover transition-colors"
                      >
                        + Add secondary parent
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                            Secondary Parent (Optional)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSecondaryParent(false);
                              setSecondaryParent({ ...emptySecondaryParent });
                            }}
                            className="text-xs text-text-secondary hover:text-accent-red transition-colors"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <label className={labelClass}>Name *</label>
                          <input
                            type="text"
                            value={secondaryParent.name}
                            onChange={(e) => setSecondaryParent({ ...secondaryParent, name: e.target.value })}
                            className={inputClass}
                            placeholder="Secondary parent full name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Email</label>
                            <input
                              type="email"
                              value={secondaryParent.email}
                              onChange={(e) => setSecondaryParent({ ...secondaryParent, email: e.target.value })}
                              className={inputClass}
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Mobile</label>
                            <input
                              type="tel"
                              value={secondaryParent.phone}
                              onChange={(e) => setSecondaryParent({ ...secondaryParent, phone: e.target.value })}
                              className={inputClass}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary">
                          Saved on the parent and shared by all their players. No account is created
                          and they cannot sign in.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ===== NEW PLAYERS ===== */}
                  <div className="border-t border-border pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      {existingParent ? 'Add Players' : 'Player Details'}
                      {players.length > 1 ? ` (${players.length})` : ''}
                    </h4>

                    {players.length === 0 && (
                      <p className="text-xs text-text-secondary">
                        No new players. Save to update the parent&apos;s details only.
                      </p>
                    )}

                    {players.map((player, index) => (
                      <div
                        key={player.key}
                        className="space-y-4 rounded-lg border border-border p-4"
                      >
                        {(players.length > 1 || isEditMode) && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-primary">
                              {players.length > 1 ? `Player ${index + 1}` : 'New player'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removePlayer(player.key)}
                              className="text-xs text-text-secondary hover:text-accent-red transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>First Name *</label>
                            <input
                              type="text"
                              value={player.firstName}
                              onChange={(e) => updatePlayer(player.key, { firstName: e.target.value })}
                              className={inputClass}
                              placeholder="Enter first name"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Last Name *</label>
                            <input
                              type="text"
                              value={player.lastName}
                              onChange={(e) => updatePlayer(player.key, {
                                lastName: e.target.value,
                                lastNameTouched: true,
                              })}
                              className={inputClass}
                              placeholder="Enter last name"
                            />
                            {!player.lastNameTouched && parentLastName && (
                              <p className="text-xs text-text-secondary mt-1">
                                Taken from the parent. Edit it if this child&apos;s surname differs.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Date of Birth *</label>
                            <DatePicker
                              selected={fromLocalISODate(player.dateOfBirth)}
                              onChange={(date) => updatePlayer(player.key, {
                                dateOfBirth: date ? toLocalISODate(date) : '',
                              })}
                              dateFormat="MM/dd/yyyy"
                              maxDate={new Date()}
                              minDate={new Date(new Date().getFullYear() - 17, 0, 1)}
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                              yearDropdownItemNumber={15}
                              scrollableYearDropdown
                              placeholderText="Select birth date"
                              className={inputClass}
                              wrapperClassName="w-full"
                              peekNextMonth
                              showPopperArrow={false}
                            />
                            {player.dateOfBirth && (
                              <p className="text-xs text-text-secondary mt-1">
                                Age Group: {AssignmentService.getAgeGroup(player.dateOfBirth) || 'Outside age range'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Joining Date</label>
                            <DatePicker
                              selected={fromLocalISODate(player.joiningDate)}
                              onChange={(date) => updatePlayer(player.key, {
                                joiningDate: date ? toLocalISODate(date) : '',
                              })}
                              dateFormat="MM/dd/yyyy"
                              maxDate={new Date()}
                              minDate={new Date(new Date().getFullYear() - 5, 0, 1)}
                              showYearDropdown
                              showMonthDropdown
                              dropdownMode="select"
                              yearDropdownItemNumber={6}
                              scrollableYearDropdown
                              placeholderText="Select joining date"
                              className={inputClass}
                              wrapperClassName="w-full"
                              showPopperArrow={false}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Preferred Foot</label>
                            <Listbox
                              value={player.basicFoot}
                              onChange={(value) => updatePlayer(player.key, { basicFoot: value })}
                            >
                              <div className="relative">
                                <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                                  <span className="block truncate">{player.basicFoot}</span>
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
                                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg">
                                    {Object.values(BasicFoot).map((foot) => (
                                      <Listbox.Option
                                        key={foot}
                                        value={foot}
                                        className={({ active }) =>
                                          `cursor-pointer px-3 py-2 ${
                                            active ? 'bg-secondary text-text-primary' : 'text-text-secondary'
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
                            <label className={labelClass}>Level</label>
                            <Listbox
                              value={player.level}
                              onChange={(value) => updatePlayer(player.key, { level: value })}
                            >
                              <div className="relative">
                                <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                                  <span className="block truncate">{player.level}</span>
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
                                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-background border border-border rounded-lg shadow-lg">
                                    {Object.values(Level).map((level) => (
                                      <Listbox.Option
                                        key={level}
                                        value={level}
                                        className={({ active }) =>
                                          `cursor-pointer px-3 py-2 ${
                                            active ? 'bg-secondary text-text-primary' : 'text-text-secondary'
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
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addPlayer}
                      className="text-sm text-primary hover:text-primary-hover transition-colors"
                    >
                      {players.length === 0 ? '+ Add a player' : '+ Add another player'}
                    </button>
                  </div>

                  {/* Auto-assign Option. Only relevant when players are being created. */}
                  {players.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={autoAssign}
                          onChange={(e) => setAutoAssign(e.target.checked)}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-text-primary">Auto-assign to group</p>
                          <p className="text-xs text-text-secondary">
                            Assign each player to an appropriate group based on age and level
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary font-medium transition-all disabled:opacity-50"
                    >
                      {isSubmitting
                        ? 'Saving...'
                        : players.length === 0
                          ? 'Save Changes'
                          : players.length > 1
                            ? `Create ${players.length} Players`
                            : 'Create Player'}
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
