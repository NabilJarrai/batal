"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { PlayerDTO, Level, BasicFoot } from '@/types/players';
import { playersAPI } from '@/lib/api';
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

export default function EditPlayerModal({ 
  isOpen, 
  onClose, 
  onComplete,
  playerId 
}: EditPlayerModalProps) {
  const [formData, setFormData] = useState<Partial<PlayerDTO>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    parentName: '',
    dateOfBirth: '',
    joiningDate: '', // Add joiningDate field
    groupId: undefined, // Add groupId field to preserve group assignment
    basicFoot: BasicFoot.RIGHT,
    level: Level.DEVELOPMENT,
    isActive: true
  });
  
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        email: player.email || '',
        phone: player.phone || '',
        parentName: player.parentName || '',
        dateOfBirth: player.dateOfBirth || '',
        joiningDate: player.joiningDate || '', // Preserve existing joining date
        groupId: player.groupId, // Preserve existing group assignment
        basicFoot: player.basicFoot || BasicFoot.RIGHT,
        level: player.level || Level.DEVELOPMENT,
        isActive: player.isActive,
        // Preserve additional fields that might not be in the edit form
        gender: player.gender,
        address: player.address,
        emergencyContactName: player.emergencyContactName,
        emergencyContactPhone: player.emergencyContactPhone,
        inactiveReason: player.inactiveReason
      });
      
      // Set birth date for DatePicker
      if (player.dateOfBirth) {
        setBirthDate(new Date(player.dateOfBirth));
      }
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
        joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0]
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
      email: '',
      phone: '',
      parentName: '',
      dateOfBirth: '',
      joiningDate: '', // Reset joiningDate as well
      groupId: undefined, // Reset groupId as well
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

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-caption mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="input-base"
                        placeholder="player@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-caption mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="input-base"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  {/* Parent Information */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Parent/Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter parent/guardian name"
                    />
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