"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlayerDTO } from '@/types/players';

interface UnassignPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  player: PlayerDTO | null;
  groupName: string;
  isLoading?: boolean;
}

export default function UnassignPlayerModal({
  isOpen,
  onClose,
  onConfirm,
  player,
  groupName,
  isLoading = false
}: UnassignPlayerModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-background-modal border border-border rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-text-primary mb-4 flex items-center">
                  <svg className="w-6 h-6 text-accent-red mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Unassign Player
                </Dialog.Title>

                <div className="mb-6">
                  <p className="text-sm text-text-secondary mb-4">
                    Are you sure you want to remove <strong className="text-text-primary">{player?.firstName} {player?.lastName}</strong> from the <strong className="text-text-primary">{groupName}</strong> group?
                  </p>
                  
                  <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg p-3">
                    <div className="flex">
                      <svg className="w-5 h-5 text-accent-yellow mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-accent-yellow">
                        This will remove the player from the group. They will become unassigned and available for assignment to other groups.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="btn-secondary btn-md flex-1"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="btn-destructive btn-md flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="loading-spinner mr-2"></div>
                        Removing...
                      </div>
                    ) : (
                      'Remove Player'
                    )}
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