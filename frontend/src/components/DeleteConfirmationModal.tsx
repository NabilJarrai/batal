"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel"
}: DeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
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
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-gray-800 border border-gray-700 rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-accent-red"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                <Dialog.Title className="text-lg font-semibold text-white text-center mb-2">
                  {title}
                </Dialog.Title>

                <div className="text-center mb-6">
                  <p className="text-sm text-text-secondary mb-2">
                    {message}
                  </p>
                  {itemName && (
                    <p className="text-sm font-medium text-white bg-gray-700/50 px-3 py-2 rounded-lg">
                      "{itemName}"
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="btn-secondary btn-md flex-1"
                  >
                    {cancelButtonText}
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
                        Deleting...
                      </div>
                    ) : (
                      confirmButtonText
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