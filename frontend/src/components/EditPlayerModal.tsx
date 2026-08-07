"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, Level, BasicFoot } from '@/types/players';
import { UserResponse } from '@/types/users';
import { playersAPI, usersAPI } from '@/lib/api';
import { AssignmentService } from '@/services/assignmentService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (player: PlayerDTO) => void;
  playerId: number | null;
}

/**
 * Format as YYYY-MM-DD in local time. toISOString() converts to UTC first,
 * which rolls a date picked west of Greenwich back to the previous day.
 */
function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromLocalISODate(value?: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function EditPlayerModal({ 
  isOpen, 
  onClose, 
  onComplete,
  playerId 
}: EditPlayerModalProps) {
  const [formData, setFormData] = useState<Partial<PlayerDTO>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    joiningDate: '',
    groupId: undefined,
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
    isActive: true
  });
  
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reassigning the main parent. Players are attached to a parent when they
  // are created, so this is the only way to correct a wrong one.
  const [isChangingParent, setIsChangingParent] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [parentResults, setParentResults] = useState<UserResponse[]>([]);
  const [isSearchingParents, setIsSearchingParents] = useState(false);

  useEffect(() => {
    if (!isChangingParent) return;

    let cancelled = false;
    setIsSearchingParents(true);
    const timer = setTimeout(async () => {
      try {
        const query = parentSearch.trim();
        const results = await usersAPI.searchParents(query.length ? query : undefined);
        if (!cancelled) setParentResults(results);
      } catch {
        if (!cancelled) setParentResults([]);
      } finally {
        if (!cancelled) setIsSearchingParents(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parentSearch, isChangingParent]);

  // Load player data when modal opens
  useEffect(() => {
    if (isOpen && playerId) {
      loadPlayerData();
    }
  }, [isOpen, playerId]);

  const loadPlayerData = async () => {
    if (!playerId) return;
    
    setIsLoading(true);
    try {
      const player = await playersAPI.getById(playerId);
      setFormData({
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        dateOfBirth: player.dateOfBirth || '',
        joiningDate: player.joiningDate || '',
        groupId: player.groupId,
        parentId: player.parentId,
        parentName: player.parentName,
        // Read-only here; owned by the parent account and ignored on write.
        secondaryParentName: player.secondaryParentName,
        secondaryParentEmail: player.secondaryParentEmail,
        secondaryParentPhone: player.secondaryParentPhone,
        basicFoot: player.basicFoot || BasicFoot.RIGHT,
        level: player.level || Level.DEVELOPMENT,
        isActive: player.isActive,
        gender: player.gender,
        address: player.address,
        emergencyContactName: player.emergencyContactName,
        emergencyContactPhone: player.emergencyContactPhone,
        inactiveReason: player.inactiveReason
      });

      // Set birth date for DatePicker
      setBirthDate(fromLocalISODate(player.dateOfBirth));
      setIsChangingParent(false);
      setParentSearch('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure joiningDate is not null/empty - use current date as fallback
      const updateData = {
        ...formData,
        joiningDate: formData.joiningDate || toLocalISODate(new Date())
      };
      
      console.log('Updating player with data (preserving groupId):', updateData);
      const updatedPlayer = await playersAPI.update(playerId, updateData);
      onComplete(updatedPlayer);
      handleClose();
    } catch (err) {
      console.error('Error updating player:', err);
      setError(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      joiningDate: '',
      groupId: undefined,
      basicFoot: BasicFoot.RIGHT,
      level: Level.DEVELOPMENT,
      isActive: true
    });
    setBirthDate(null);
    setError(null);
    onClose();
  };

  const calculateAgeGroup = () => {
    if (!formData.dateOfBirth) return null;
    return AssignmentService.getAgeGroup(formData.dateOfBirth);
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-heading-4 mb-4">
                  Edit Player
                </Dialog.Title>

                {error && (
                  <div className="alert-error mb-4">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-caption mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="input-base"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="text-caption mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="input-base"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Player Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-caption mb-1">
                        Date of Birth *
                      </label>
                      <DatePicker
                        selected={birthDate}
                        onChange={(date) => {
                          setBirthDate(date);
                          setFormData({...formData, dateOfBirth: date ? toLocalISODate(date) : ''});
                        }}
                        dateFormat="MM/dd/yyyy"
                        maxDate={new Date()}
                        minDate={new Date(new Date().getFullYear() - 17, 0, 1)}
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={15}
                        scrollableYearDropdown
                        placeholderText="Select birth date"
                        className="input-base"
                        wrapperClassName="w-full"
                        required
                        peekNextMonth
                        showPopperArrow={false}
                      />
                      {formData.dateOfBirth && (
                        <p className="text-xs text-text-secondary mt-1">
                          Age Group: {calculateAgeGroup() || 'Outside age range'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-caption mb-1">
                        Level *
                      </label>
                      <Listbox 
                        value={formData.level} 
                        onChange={(value) => setFormData({...formData, level: value})}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                            {formData.level}
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-10 mt-1 w-full bg-background-modal border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                            {Object.values(Level).map((level) => (
                              <Listbox.Option
                                key={level}
                                value={level}
                                className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-text-primary"
                              >
                                {level}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  </div>

                  {/* Football Details */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Preferred Foot
                    </label>
                    <Listbox 
                      value={formData.basicFoot} 
                      onChange={(value) => setFormData({...formData, basicFoot: value})}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                          {formData.basicFoot}
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-background-modal border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                          {Object.values(BasicFoot).map((foot) => (
                            <Listbox.Option
                              key={foot}
                              value={foot}
                              className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-text-primary"
                            >
                              {foot}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {/* Main Parent */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-caption">Main Parent</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingParent(!isChangingParent);
                          setParentSearch('');
                        }}
                        className="text-xs text-primary hover:text-primary-hover transition-colors"
                      >
                        {isChangingParent ? 'Cancel' : 'Change'}
                      </button>
                    </div>

                    <p className="text-sm text-text-primary">
                      {formData.parentName || 'No parent assigned'}
                    </p>

                    {isChangingParent && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          placeholder="Search parents by name or email..."
                          className="input-base"
                        />
                        <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                          {isSearchingParents ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                            </div>
                          ) : parentResults.length === 0 ? (
                            <p className="text-xs text-text-secondary text-center py-4">
                              No parents found
                            </p>
                          ) : (
                            parentResults.map((parent) => (
                              <button
                                key={parent.id}
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    parentId: parent.id,
                                    parentName: `${parent.firstName} ${parent.lastName}`,
                                  });
                                  setIsChangingParent(false);
                                }}
                                className={`w-full px-3 py-2 text-left border-b border-border last:border-b-0 text-sm transition-colors ${
                                  formData.parentId === parent.id
                                    ? 'bg-blue-500/20 border-l-4 border-l-blue-500'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                <span className="font-medium text-text-primary">
                                  {parent.firstName} {parent.lastName}
                                </span>
                                <span className="text-text-secondary ml-2">{parent.email}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary parent, shown read-only: it belongs to the
                      parent's account and is shared by all their players, so
                      it is edited from the Parents tab. */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <label className="text-caption">Secondary Parent</label>
                    {formData.secondaryParentName ? (
                      <p className="text-sm text-text-primary">
                        {formData.secondaryParentName}
                        {formData.secondaryParentPhone ? ` • ${formData.secondaryParentPhone}` : ''}
                        {formData.secondaryParentEmail ? ` • ${formData.secondaryParentEmail}` : ''}
                      </p>
                    ) : (
                      <p className="text-sm text-text-secondary">None</p>
                    )}
                    <p className="text-xs text-text-secondary">
                      Shared by all of this parent&apos;s players. Edit it on the parent in the
                      Parents tab.
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="form-checkbox h-4 w-4 text-primary bg-background border-border rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-secondary">Active Player</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="btn-secondary btn-md flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary btn-md flex-1"
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
                        'Update Player'
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