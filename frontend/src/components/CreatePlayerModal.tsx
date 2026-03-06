"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, Level, BasicFoot } from '@/types/players';
import { AgeGroup } from '@/types/groups';
import { playersAPI, usersAPI } from '@/lib/api';
import { AssignmentService } from '@/services/assignmentService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/datepicker.css';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (player: PlayerDTO) => void;
}

export default function CreatePlayerModal({
  isOpen,
  onClose,
  onComplete
}: CreatePlayerModalProps) {
  // Player form data (no email/phone — contact info lives on parent)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
    isActive: true,
    joiningDate: new Date().toISOString().split('T')[0],
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [joiningDate, setJoiningDate] = useState<Date | null>(new Date());

  // Parent state
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [isCreatingNewParent, setIsCreatingNewParent] = useState(false);
  const [newParentData, setNewParentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE' as string,
  });
  const [isSearchingParents, setIsSearchingParents] = useState(false);

  const [autoAssign, setAutoAssign] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced parent search
  useEffect(() => {
    if (parentSearchQuery.length < 2 || isCreatingNewParent) {
      setParentSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingParents(true);
      try {
        const results = await usersAPI.searchParents(parentSearchQuery);
        setParentSearchResults(results);
      } catch (err) {
        console.error('Failed to search parents:', err);
      } finally {
        setIsSearchingParents(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [parentSearchQuery, isCreatingNewParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let parentId: number;

      // Step 1: Create parent if new
      if (isCreatingNewParent) {
        if (!newParentData.firstName || !newParentData.lastName || !newParentData.email) {
          setError('Please fill in parent first name, last name, and email');
          setIsSubmitting(false);
          return;
        }
        const createdParent = await usersAPI.create({
          firstName: newParentData.firstName,
          lastName: newParentData.lastName,
          email: newParentData.email,
          phone: newParentData.phone,
          gender: newParentData.gender,
          userType: 'PARENT',
        });
        parentId = createdParent.id;
      } else if (selectedParent) {
        parentId = selectedParent.id;
      } else {
        setError('Please select or create a parent');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Create player with parentId
      const createdPlayer = await playersAPI.create({
        ...formData,
        parentId,
      });

      // Step 3: Assign child to parent via join table
      await usersAPI.assignChild(parentId, createdPlayer.id);

      // Auto-assign group if requested
      if (autoAssign && formData.dateOfBirth) {
        try {
          const updatedPlayer = await playersAPI.autoAssignGroup(createdPlayer.id);
          createdPlayer.groupId = updatedPlayer.groupId;
          createdPlayer.groupName = updatedPlayer.groupName;
        } catch (err) {
          console.error('Auto-assign failed:', err);
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
      joiningDate: new Date().toISOString().split('T')[0],
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
    setBirthDate(null);
    setJoiningDate(new Date());
    setParentSearchQuery('');
    setParentSearchResults([]);
    setSelectedParent(null);
    setIsCreatingNewParent(false);
    setNewParentData({ firstName: '', lastName: '', email: '', phone: '', gender: 'MALE' });
    setAutoAssign(true);
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* ===== Section 1: Parent ===== */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-text-primary mb-3">Parent / Guardian</h4>

                    {!isCreatingNewParent ? (
                      <>
                        {/* Parent Search */}
                        {!selectedParent ? (
                          <div>
                            <input
                              type="text"
                              value={parentSearchQuery}
                              onChange={(e) => setParentSearchQuery(e.target.value)}
                              placeholder="Search existing parent by name or email..."
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            {isSearchingParents && (
                              <p className="text-xs text-text-secondary mt-1">Searching...</p>
                            )}
                            {parentSearchResults.length > 0 && (
                              <div className="mt-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                                {parentSearchResults.map((parent) => (
                                  <button
                                    key={parent.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedParent(parent);
                                      setParentSearchQuery('');
                                      setParentSearchResults([]);
                                    }}
                                    className="w-full p-2 text-left hover:bg-secondary border-b border-border last:border-b-0 transition-colors"
                                  >
                                    <p className="text-sm font-medium text-text-primary">
                                      {parent.firstName} {parent.lastName}
                                    </p>
                                    <p className="text-xs text-text-secondary">{parent.email}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                            {parentSearchQuery.length >= 2 && !isSearchingParents && parentSearchResults.length === 0 && (
                              <p className="text-xs text-text-secondary mt-1">No parents found</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {selectedParent.firstName} {selectedParent.lastName}
                              </p>
                              <p className="text-xs text-text-secondary">{selectedParent.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedParent(null)}
                              className="text-xs text-accent-red hover:underline"
                            >
                              Change
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewParent(true);
                            setSelectedParent(null);
                            setParentSearchQuery('');
                            setParentSearchResults([]);
                          }}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          + Create new parent
                        </button>
                      </>
                    ) : (
                      <>
                        {/* New Parent Form */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">First Name *</label>
                              <input
                                type="text"
                                required
                                value={newParentData.firstName}
                                onChange={(e) => setNewParentData({...newParentData, firstName: e.target.value})}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Parent first name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Last Name *</label>
                              <input
                                type="text"
                                required
                                value={newParentData.lastName}
                                onChange={(e) => setNewParentData({...newParentData, lastName: e.target.value})}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Parent last name"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Email *</label>
                              <input
                                type="email"
                                required
                                value={newParentData.email}
                                onChange={(e) => setNewParentData({...newParentData, email: e.target.value})}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="parent@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                              <input
                                type="tel"
                                value={newParentData.phone}
                                onChange={(e) => setNewParentData({...newParentData, phone: e.target.value})}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="+1234567890"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewParent(false);
                            setNewParentData({ firstName: '', lastName: '', email: '', phone: '', gender: 'MALE' });
                          }}
                          className="mt-2 text-xs text-text-secondary hover:underline"
                        >
                          ← Search existing parent instead
                        </button>
                      </>
                    )}
                  </div>

                  {/* ===== Section 2: Player Details ===== */}
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

                  {/* Date fields */}
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

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* ===== Section 3: Auto-assign ===== */}
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
