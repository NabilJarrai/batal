"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AssignmentService } from '@/services/assignmentService';
import { PlayerDTO, Level } from '@/types/players';
import { apiClient } from '@/lib/apiClient';

interface PromotionModalProps {
  isOpen: boolean;
  playerId: number | null;
  onClose: () => void;
  onComplete: () => void;
}

export default function PromotionModal({ 
  isOpen, 
  playerId,
  onClose, 
  onComplete 
}: PromotionModalProps) {
  const [player, setPlayer] = useState<PlayerDTO | null>(null);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reasons: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && playerId) {
      loadPlayerAndCheckEligibility();
    }
  }, [isOpen, playerId]);

  const loadPlayerAndCheckEligibility = async () => {
    if (!playerId) return;

    try {
      const playerData = await apiClient.get<PlayerDTO>(`/players/${playerId}`);
      setPlayer(playerData);

      const eligibilityCheck = await AssignmentService.validatePromotion(playerId);
      setEligibility(eligibilityCheck);
    } catch (error) {
      console.error('Failed to load player:', error);
    }
  };

  const handlePromotion = async () => {
    if (!playerId) return;
    
    setIsProcessing(true);

    try {
      const success = await AssignmentService.promotePlayer(playerId);
      
      if (success) {
        setResult({
          success: true,
          message: `Successfully promoted ${player?.firstName} ${player?.lastName} to Advanced level!`
        });

        setTimeout(() => {
          onComplete();
          handleClose();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: 'Failed to promote player. Please try again.'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred during promotion.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPlayer(null);
    setEligibility(null);
    setResult(null);
    onClose();
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-white mb-4">
                  Promote Player to Advanced Level
                </Dialog.Title>

                {player && !result && (
                  <div className="space-y-4">
                    {/* Player Info */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">
                          {player.firstName} {player.lastName}
                        </h4>
                        <span className="px-2 py-1 bg-blue-500 text-xs rounded-full text-white">
                          {player.level}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-gray-300">{player.email}</span>
                        </div>
                        {player.dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Age:</span>
                            <span className="text-gray-300">{getAge(player.dateOfBirth)} years</span>
                          </div>
                        )}
                        {player.groupName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Current Group:</span>
                            <span className="text-gray-300">{player.groupName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Eligibility Check */}
                    {eligibility && (
                      <div className={`rounded-lg p-4 ${
                        eligibility.eligible 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          {eligibility.eligible ? (
                            <>
                              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-green-400 font-medium">Eligible for Promotion</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-red-400 font-medium">Not Eligible</span>
                            </>
                          )}
                        </div>
                        {eligibility.reasons.length > 0 && (
                          <ul className="space-y-1">
                            {eligibility.reasons.map((reason, idx) => (
                              <li key={idx} className={`text-sm ${
                                eligibility.eligible ? 'text-green-300' : 'text-red-300'
                              }`}>
                                • {reason}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Promotion Details */}
                    {eligibility?.eligible && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-blue-400 font-medium mb-2">What happens next:</h4>
                        <ul className="space-y-1 text-sm text-blue-300">
                          <li>• Player will be promoted to Advanced level</li>
                          <li>• Current group assignment will be removed</li>
                          <li>• Player will be auto-assigned to an Advanced group</li>
                          <li>• New training schedule will apply</li>
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                      >
                        Cancel
                      </button>
                      {eligibility?.eligible && (
                        <button
                          onClick={handlePromotion}
                          disabled={isProcessing}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white transition-all disabled:opacity-50"
                        >
                          {isProcessing ? 'Promoting...' : 'Confirm Promotion'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className="space-y-4">
                    <div className={`rounded-lg p-6 text-center ${
                      result.success
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      {result.success ? (
                        <svg className="w-16 h-16 text-green-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-16 h-16 text-red-400 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className={`text-lg ${
                        result.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.message}
                      </p>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                    >
                      Close
                    </button>
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