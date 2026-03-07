"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, Level, BasicFoot } from '@/types/players';
import { UserResponse, UserType } from '@/types/users';
import { apiClient } from '@/lib/apiClient';
import { usersAPI } from '@/lib/api';
import { AssignmentService } from '@/services/assignmentService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (player: PlayerDTO) => void;
}

type ParentMode = 'existing' | 'new';

interface ParentSlotState {
  mode: ParentMode;
  search: string;
  results: UserResponse[];
  selected: UserResponse | null;
  isSearching: boolean;
  newParent: { firstName: string; lastName: string; email: string; phone: string };
}

const emptyParentSlot: ParentSlotState = {
  mode: 'existing',
  search: '',
  results: [],
  selected: null,
  isSearching: false,
  newParent: { firstName: '', lastName: '', email: '', phone: '' },
};

function ParentPickerSection({
  label,
  slot,
  setSlot,
  hideLabel = false,
}: {
  label: string;
  slot: ParentSlotState;
  setSlot: React.Dispatch<React.SetStateAction<ParentSlotState>>;
  hideLabel?: boolean;
}) {
  return (
    <div className="space-y-3">
      {!hideLabel && (
        <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          {label}
        </h4>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSlot(prev => ({ ...prev, mode: 'existing', selected: null }))}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            slot.mode === 'existing'
              ? 'bg-primary text-white'
              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
          }`}
        >
          Select Existing
        </button>
        <button
          type="button"
          onClick={() => setSlot(prev => ({ ...prev, mode: 'new', selected: null }))}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            slot.mode === 'new'
              ? 'bg-primary text-white'
              : 'bg-secondary-100 text-text-primary border border-border hover:bg-secondary-50'
          }`}
        >
          Create New
        </button>
      </div>

      {slot.mode === 'existing' ? (
        <div className="space-y-2">
          <input
            type="text"
            value={slot.search}
            onChange={(e) => setSlot(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search parents by name or email..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
            {slot.isSearching ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
                <span className="ml-2 text-xs text-text-secondary">Searching...</span>
              </div>
            ) : slot.results.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">
                {slot.search ? 'No parents found' : 'No parents registered yet'}
              </p>
            ) : (
              slot.results.map((parent) => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => setSlot(prev => ({ ...prev, selected: parent }))}
                  className={`w-full px-3 py-2 text-left border-b border-border last:border-b-0 transition-colors text-sm ${
                    slot.selected?.id === parent.id
                      ? 'bg-blue-500/20 border-l-4 border-l-blue-500'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className="font-medium text-text-primary">
                    {parent.firstName} {parent.lastName}
                  </span>
                  <span className="text-text-secondary ml-2">
                    {parent.email}
                  </span>
                  {parent.phone && (
                    <span className="text-text-secondary ml-2">
                      • {parent.phone}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {slot.selected && (
            <p className="text-xs text-green-400">
              Selected: {slot.selected.firstName} {slot.selected.lastName} ({slot.selected.email})
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={slot.newParent.firstName}
                onChange={(e) => setSlot(prev => ({ ...prev, newParent: { ...prev.newParent, firstName: e.target.value } }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Parent first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={slot.newParent.lastName}
                onChange={(e) => setSlot(prev => ({ ...prev, newParent: { ...prev.newParent, lastName: e.target.value } }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Parent last name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email *
              </label>
              <input
                type="email"
                value={slot.newParent.email}
                onChange={(e) => setSlot(prev => ({ ...prev, newParent: { ...prev.newParent, email: e.target.value } }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="parent@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={slot.newParent.phone}
                onChange={(e) => setSlot(prev => ({ ...prev, newParent: { ...prev.newParent, phone: e.target.value } }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+1234567890"
              />
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            A password setup email will be sent to the parent automatically.
          </p>
        </div>
      )}
    </div>
  );
}

export default function CreatePlayerModal({
  isOpen,
  onClose,
  onComplete
}: CreatePlayerModalProps) {
  // Parent section state
  const [parent1, setParent1] = useState<ParentSlotState>({ ...emptyParentSlot });
  const [parent2, setParent2] = useState<ParentSlotState>({ ...emptyParentSlot });
  const [showParent2, setShowParent2] = useState(false);

  // Player section state
  const [formData, setFormData] = useState<Partial<PlayerDTO>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
    isActive: true,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [joiningDate, setJoiningDate] = useState<Date | null>(new Date());
  const [autoAssign, setAutoAssign] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced parent search for both slots
  const useParentSearch = (slot: ParentSlotState, setSlot: React.Dispatch<React.SetStateAction<ParentSlotState>>) => {
    useEffect(() => {
      if (slot.mode !== 'existing') return;

      const timer = setTimeout(async () => {
        setSlot(prev => ({ ...prev, isSearching: true }));
        try {
          const query = slot.search.trim();
          const results = query.length === 0
            ? await usersAPI.searchParents()
            : await usersAPI.searchParents(query);
          setSlot(prev => ({ ...prev, results, isSearching: false }));
        } catch {
          setSlot(prev => ({ ...prev, results: [], isSearching: false }));
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [slot.search, slot.mode]);
  };

  useParentSearch(parent1, setParent1);
  useParentSearch(parent2, setParent2);

  // Load parents when modal opens
  useEffect(() => {
    if (isOpen && parent1.mode === 'existing') {
      setParent1(prev => ({ ...prev, search: '' }));
    }
  }, [isOpen, parent1.mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Resolve parent 1
      const resolveParent = async (slot: ParentSlotState): Promise<number | undefined> => {
        if (slot.mode === 'new') {
          if (!slot.newParent.firstName || !slot.newParent.lastName || !slot.newParent.email) {
            throw new Error('Parent first name, last name, and email are required');
          }
          const created = await usersAPI.create({
            firstName: slot.newParent.firstName,
            lastName: slot.newParent.lastName,
            email: slot.newParent.email,
            phone: slot.newParent.phone || undefined,
            userType: UserType.PARENT,
          });
          return created.id;
        } else if (slot.selected) {
          return slot.selected.id;
        }
        return undefined;
      };

      const parentId = await resolveParent(parent1);
      let parent2Id: number | undefined;
      if (showParent2) {
        parent2Id = await resolveParent(parent2);
      }

      // Create the player with parentId(s)
      const playerData = { ...formData, parentId, parent2Id };
      const createdPlayer = await apiClient.post<PlayerDTO>('/players', playerData);

      // Step 3: Auto-assign group if requested
      if (autoAssign && formData.dateOfBirth) {
        const group = await AssignmentService.autoAssignPlayer(createdPlayer);
        if (group) {
          createdPlayer.groupId = group.id;
          createdPlayer.groupName = group.name;
        }
      }

      onComplete(createdPlayer);
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
      dateOfBirth: '',
      basicFoot: BasicFoot.RIGHT,
      level: Level.DEVELOPMENT,
      isActive: true,
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setBirthDate(null);
    setJoiningDate(new Date());
    setAutoAssign(true);
    setParent1({ ...emptyParentSlot });
    setParent2({ ...emptyParentSlot });
    setShowParent2(false);
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-4">
                  Add New Player
                </Dialog.Title>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ===== Parent Picker Sections ===== */}
                  <ParentPickerSection
                    label="Parent 1 (Optional)"
                    slot={parent1}
                    setSlot={setParent1}
                  />

                  {!showParent2 ? (
                    <button
                      type="button"
                      onClick={() => setShowParent2(true)}
                      className="text-sm text-primary hover:text-primary-hover transition-colors"
                    >
                      + Add Parent 2
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">Parent 2 (Optional)</span>
                        <button
                          type="button"
                          onClick={() => { setShowParent2(false); setParent2({ ...emptyParentSlot }); }}
                          className="text-xs text-text-secondary hover:text-accent-red transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <ParentPickerSection
                        label=""
                        slot={parent2}
                        setSlot={setParent2}
                        hideLabel
                      />
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border"></div>

                  {/* ===== SECTION 2: Player Details ===== */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                      Player Details
                    </h4>

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Date of Birth *
                        </label>
                        <DatePicker
                          selected={birthDate}
                          onChange={(date) => {
                            setBirthDate(date);
                            setFormData({...formData, dateOfBirth: date ? date.toISOString().split('T')[0] : ''});
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
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
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
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Joining Date
                        </label>
                        <DatePicker
                          selected={joiningDate}
                          onChange={(date) => {
                            setJoiningDate(date);
                            setFormData({...formData, joiningDate: date ? date.toISOString().split('T')[0] : ''});
                          }}
                          dateFormat="MM/dd/yyyy"
                          maxDate={new Date()}
                          minDate={new Date(new Date().getFullYear() - 5, 0, 1)}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={6}
                          scrollableYearDropdown
                          placeholderText="Select joining date"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                          wrapperClassName="w-full"
                          showPopperArrow={false}
                        />
                      </div>
                    </div>

                    {/* Football Details */}
                    <div className="grid grid-cols-2 gap-4">
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
                              <span className="block truncate">{formData.basicFoot}</span>
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
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Level
                        </label>
                        <Listbox
                          value={formData.level}
                          onChange={(value) => setFormData({...formData, level: value})}
                        >
                          <div className="relative">
                            <Listbox.Button className="relative w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary">
                              <span className="block truncate">{formData.level}</span>
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
                        <p className="text-sm font-medium text-text-primary">Auto-assign to group</p>
                        <p className="text-xs text-text-secondary">
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
                      className="flex-1 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary font-medium transition-all disabled:opacity-50"
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
