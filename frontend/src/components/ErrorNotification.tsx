"use client";

import { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'error' | 'success' | 'warning' | 'info';

interface ErrorNotificationProps {
  show: boolean;
  type?: NotificationType;
  title?: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function ErrorNotification({
  show,
  type = 'error',
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}: ErrorNotificationProps) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
      case 'error':
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700'
        };
      case 'error':
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
      <Transition
        show={show}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className={`${colors.bg} backdrop-blur-lg ${colors.border} border rounded-2xl shadow-2xl p-4`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              {title && (
                <p className="text-sm font-medium text-white">
                  {title}
                </p>
              )}
              <p className={`text-sm ${colors.text} ${title ? 'mt-1' : ''}`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className="inline-flex text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {autoClose && (
            <div className="mt-3">
              <div className={`h-1 ${colors.bg} rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-white/30 rounded-full animate-shrink"
                  style={{ animationDuration: `${autoCloseDelay}ms` }}
                />
              </div>
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
}