"use client";

import { useState } from 'react';
import { PlayerDTO, Level } from '@/types/players';

interface PlayerCardProps {
  player: PlayerDTO;
  onEdit?: (playerId: number) => void;
  onDeactivate?: (playerId: number, reason: string) => void;
  onReactivate?: (playerId: number) => void;
  onPromote?: (playerId: number) => void;
  onAssignGroup?: (playerId: number) => void;
  onUnassignGroup?: (playerId: number) => void;
  onReassignGroup?: (playerId: number) => void;
  onViewDetails?: (playerId: number) => void;
  showActions?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (playerId: number) => void;
}

export default function PlayerCard({
  player,
  onEdit,
  onDeactivate,
  onReactivate,
  onPromote,
  onAssignGroup,
  onUnassignGroup,
  onReassignGroup,
  onViewDetails,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect
}: PlayerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  const getLevelColor = (level: Level) => {
    return level === Level.DEVELOPMENT
      ? 'from-blue-500 to-blue-600'
      : 'from-purple-500 to-purple-600';
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

  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(player.id!);
    } else if (onViewDetails) {
      onViewDetails(player.id!);
    }
  };

  const handleDeactivate = () => {
    if (onDeactivate && deactivateReason.trim()) {
      onDeactivate(player.id!, deactivateReason.trim());
      setShowDeactivateModal(false);
      setDeactivateReason('');
    }
  };

  return (
    <>
      <div
        className={`
          relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6
          transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
          ${isSelectable ? 'cursor-pointer' : ''}
          ${isSelected ? 'ring-2 ring-cyan-400 bg-white/20' : ''}
          ${player.isActive ? '' : 'opacity-60'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Status Indicator */}
        <div className="absolute top-4 right-4">
          <div className={`
            w-3 h-3 rounded-full
            ${player.isActive ? 'bg-green-400' : 'bg-red-400'}
          `} />
        </div>

        {/* Player Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-white">
              {player.firstName} {player.lastName}
            </h3>
            {!player.groupId && (
              <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300">
                Unassigned
              </span>
            )}
          </div>

          {/* Level Badge */}
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
            bg-gradient-to-r ${getLevelColor(player.level)}
          `}>
            {player.level}
            {player.level === Level.DEVELOPMENT && onPromote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPromote(player.id!);
                }}
                className="ml-2 text-xs hover:text-yellow-200"
                title="Promote to Advanced"
              >
                ↗
              </button>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-blue-200">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-sm">{player.email}</span>
          </div>

          {player.phone && (
            <div className="flex items-center text-blue-200">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="text-sm">{player.phone}</span>
            </div>
          )}
        </div>

        {/* Age & Date of Birth */}
        {player.dateOfBirth && (
          <div className="mb-4">
            <div className="flex items-center text-blue-200 mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Age</span>
            </div>
            <p className="text-sm text-white">
              {getAge(player.dateOfBirth)} years old
            </p>
            <p className="text-xs text-blue-300">
              Born: {new Date(player.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Parent Info */}
        <div className="mb-4">
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Parent</span>
          </div>
          <p className="text-sm text-white">{player.parentName}</p>
        </div>

        {/* Group Assignment */}
        <div className="mb-4">
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Group</span>
          </div>
          {player.groupName ? (
            <div>
              <p className="text-sm text-white mb-1">{player.groupName}</p>
              {showActions && (
                <div className="flex gap-2 mt-1">
                  {onReassignGroup && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReassignGroup(player.id!);
                      }}
                      className="text-xs bg-blue-500/20 hover:bg-blue-500/30 px-2 py-1 rounded text-blue-200 transition-colors"
                      title="Reassign to another group"
                    >
                      Reassign
                    </button>
                  )}
                  {onUnassignGroup && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnassignGroup(player.id!);
                      }}
                      className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded text-red-200 transition-colors"
                      title="Remove from group"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <p className="text-sm text-gray-400 italic mr-2">No group assigned</p>
              {showActions && onAssignGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignGroup(player.id!);
                  }}
                  className="text-xs bg-green-500/20 hover:bg-green-500/30 px-2 py-1 rounded text-green-200 transition-colors"
                >
                  Assign to Group
                </button>
              )}
            </div>
          )}
        </div>

        {/* Basic Foot */}
        {player.basicFoot && (
          <div className="mb-4">
            <div className="flex items-center text-blue-200 mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Preferred Foot</span>
            </div>
            <p className="text-sm text-white">{player.basicFoot}</p>
          </div>
        )}

        {/* Joining Date */}
        {player.joiningDate && (
          <div className="mb-4">
            <div className="flex items-center text-blue-200 mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Joined</span>
            </div>
            <p className="text-sm text-white">
              {new Date(player.joiningDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Inactive Reason */}
        {!player.isActive && player.inactiveReason && (
          <div className="mb-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-200">
                <strong>Inactive:</strong> {player.inactiveReason}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className={`
            flex gap-2 mt-6 transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-70'}
          `}>
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(player.id!);
                }}
                className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-200 text-sm font-medium transition-colors duration-200"
              >
                Details
              </button>
            )}

            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(player.id!);
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}

            {player.isActive && onDeactivate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeactivateModal(true);
                }}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium transition-colors duration-200"
              >
                Deactivate
              </button>
            )}

            {!player.isActive && onReactivate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReactivate(player.id!);
                }}
                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-200 text-sm font-medium transition-colors duration-200"
              >
                Reactivate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeactivateModal(false)} />
          <div className="relative bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Deactivate Player</h3>
            <p className="text-sm text-gray-300 mb-4">
              Please provide a reason for deactivating {player.firstName} {player.lastName}:
            </p>
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Reason for deactivation..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={!deactivateReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-200 disabled:opacity-50"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}