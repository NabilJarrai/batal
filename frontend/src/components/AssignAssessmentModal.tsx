"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { GroupResponse } from '@/types/groups';
import { groupsAPI } from '@/lib/api';
import AssessmentTemplateSelect from '@/components/assessments/AssessmentTemplateSelect';

interface AssignAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupResponse | null;
  onComplete: (group: GroupResponse, message: string) => void;
  onError: (message: string) => void;
}

/**
 * Set a group's assessment straight from its card, without opening the full
 * edit form for a one-field change.
 */
export default function AssignAssessmentModal({
  isOpen,
  onClose,
  group,
  onComplete,
  onError,
}: AssignAssessmentModalProps) {
  const [templateId, setTemplateId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !group) return;
    setTemplateId(group.assessmentTemplateId);
  }, [isOpen, group]);

  const handleSave = async () => {
    if (!group) return;

    setIsSubmitting(true);
    try {
      let updated: GroupResponse;
      let message: string;

      if (templateId === undefined) {
        // A null id means "no change" to the update endpoint, so clearing has
        // its own call.
        updated = await groupsAPI.removeAssessmentTemplate(group.id);
        message = `${group.name} has no assessment now, so its players cannot be assessed`;
      } else {
        updated = await groupsAPI.update(group.id, { assessmentTemplateId: templateId });
        message = `Assessment assigned to ${group.name}`;
      }

      onComplete(updated, message);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to assign the assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) return null;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-visible rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-1">
                  Assessment for {group.name}
                </Dialog.Title>
                <p className="text-xs text-text-secondary mb-4">
                  Decides which skills this group&apos;s players are scored on.
                </p>

                <AssessmentTemplateSelect value={templateId} onChange={setTemplateId} />

                <div className="flex gap-3 pt-6">
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
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary font-medium transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
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
