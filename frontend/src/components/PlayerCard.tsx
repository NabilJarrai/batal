"use client";

import { useState } from 'react';
import { PlayerDTO, Level } from '@/types/players';

interface PlayerCardProps {
  player: PlayerDTO;
  onEdit?: (playerId: number) => void;
  onDelete?: (playerId: number) => void;
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
  onDelete,
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
      ? 'from-primary to-primary-hover'
      : 'from-secondary to-secondary-600';
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
          card-base p-6 relative
          ${isSelectable ? 'card-interactive' : 'card-hover'}
          ${isSelected ? 'card-selected' : ''}
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
            <h3 className="text-xl font-semibold text-text-primary">
              {player.firstName} {player.lastName}
            </h3>
            {!player.groupId && (
              <span className="px-2 py-1 bg-accent-yellow/20 border border-accent-yellow/30 rounded-full text-xs text-accent-yellow">
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
                className="ml-2 text-xs hover:text-accent-yellow"
                title="Promote to Advanced"
              >
                ↗
              </button>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-primary">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-sm">{player.email}</span>
          </div>

          {player.phone && (
            <div className="flex items-center text-primary">
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
            <div className="flex items-center text-primary mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Age</span>
            </div>
            <p className="text-sm text-text-primary">
              {getAge(player.dateOfBirth)} years old
            </p>
            <p className="text-xs text-text-secondary">
              Born: {new Date(player.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Parent Info */}
        <div className="mb-4">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Parent</span>
          </div>
          <p className="text-sm text-text-primary">{player.parentName}</p>
        </div>

        {/* Group Assignment */}
        <div className="mb-4">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Group</span>
          </div>
          {player.groupName ? (
            <div>
              <p className="text-sm text-text-primary mb-1">{player.groupName}</p>
              {showActions && (
                <div className="flex gap-2 mt-1">
                  {onReassignGroup && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReassignGroup(player.id!);
                      }}
                      className="btn-outline btn-xs"
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
                      className="btn-destructive btn-xs"
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
              <p className="text-sm text-text-secondary italic mr-2">No group assigned</p>
              {showActions && onAssignGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignGroup(player.id!);
                  }}
                  className="btn-success btn-xs"
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
            <div className="flex items-center text-primary mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Preferred Foot</span>
            </div>
            <p className="text-sm text-text-primary">{player.basicFoot}</p>
          </div>
        )}

        {/* Joining Date */}
        {player.joiningDate && (
          <div className="mb-4">
            <div className="flex items-center text-primary mb-1">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Joined</span>
            </div>
            <p className="text-sm text-text-primary">
              {new Date(player.joiningDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Inactive Reason */}
        {!player.isActive && player.inactiveReason && (
          <div className="mb-4">
            <div className="bg-accent-red/20 border border-accent-red/30 rounded-lg p-3">
              <p className="text-sm text-accent-red">
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
                className="btn-outline btn-sm flex-1"
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
                className="btn-secondary btn-sm"
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
                className="btn-destructive btn-sm"
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
                className="btn-success btn-sm"
              >
                Reactivate
              </button>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(player.id!);
                }}
                className="btn-destructive btn-sm"
                title="Delete Player"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeactivateModal(false)} />
          <div className="relative bg-background-modal border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-text-primary mb-4">Deactivate Player</h3>
            <p className="text-sm text-text-secondary mb-4">
              Please provide a reason for deactivating {player.firstName} {player.lastName}:
            </p>
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Reason for deactivation..."
              className="input-error mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="btn-secondary btn-md flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={!deactivateReason.trim()}
                className="btn-destructive btn-md flex-1"
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