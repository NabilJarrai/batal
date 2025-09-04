"use client";

import { useState } from 'react';
import { GroupResponse, AGE_GROUP_METADATA } from '@/types/groups';
import { Level } from '@/types/players';
import { PlayerDTO } from '@/types/players';
import UnassignPlayerModal from './UnassignPlayerModal';
import ReassignPlayerModal from './ReassignPlayerModal';

interface GroupCardProps {
  group: GroupResponse;
  onAssignCoach?: (groupId: number) => void;
  onAssignPlayer?: (groupId: number) => void;
  onRemoveCoach?: (groupId: number) => void;
  onRemovePlayer?: (groupId: number, playerId: number) => void;
  onUnassignPlayer?: (groupId: number, playerId: number) => void;
  onReassignPlayer?: (playerId: number, fromGroupId: number, toGroupId: number) => void;
  onViewDetails?: (groupId: number) => void;
  onEdit?: (groupId: number) => void;
  onDelete?: (groupId: number) => void;
  showActions?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (groupId: number) => void;
}

export default function GroupCard({ 
  group, 
  onAssignCoach,
  onAssignPlayer,
  onRemoveCoach,
  onRemovePlayer,
  onUnassignPlayer,
  onReassignPlayer, 
  onViewDetails, 
  onEdit,
  onDelete,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect
}: GroupCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [unassignModal, setUnassignModal] = useState<{
    isOpen: boolean;
    player: PlayerDTO | null;
  }>({
    isOpen: false,
    player: null
  });
  
  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    player: PlayerDTO | null;
  }>({
    isOpen: false,
    player: null
  });
  
  const ageGroupMeta = AGE_GROUP_METADATA[group.ageGroup];
  const utilizationPercentage = Math.round((group.currentPlayerCount / group.capacity) * 100);
  
  const getLevelColor = (level: Level) => {
    return level === Level.DEVELOPMENT 
      ? 'from-blue-500 to-blue-600' 
      : 'from-purple-500 to-purple-600';
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleUnassignClick = (player: PlayerDTO) => {
    setUnassignModal({
      isOpen: true,
      player: player
    });
  };

  const handleUnassignConfirm = () => {
    if (unassignModal.player && unassignModal.player.id && onUnassignPlayer) {
      onUnassignPlayer(group.id, unassignModal.player.id);
    }
    setUnassignModal({ isOpen: false, player: null });
  };

  const handleUnassignClose = () => {
    setUnassignModal({ isOpen: false, player: null });
  };

  const handleReassignClick = (player: PlayerDTO) => {
    setReassignModal({
      isOpen: true,
      player: player
    });
  };

  const handleReassignConfirm = (newGroupId: number) => {
    if (reassignModal.player && reassignModal.player.id && onReassignPlayer) {
      onReassignPlayer(reassignModal.player.id, group.id, newGroupId);
    }
    setReassignModal({ isOpen: false, player: null });
  };

  const handleReassignClose = () => {
    setReassignModal({ isOpen: false, player: null });
  };

  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(group.id);
    } else if (onViewDetails) {
      onViewDetails(group.id);
    }
  };

  return (
    <div 
      className={`
        relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 
        transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
        ${isSelectable ? 'cursor-pointer' : ''}
        ${isSelected ? 'ring-2 ring-cyan-400 bg-white/20' : ''}
        ${group.isActive ? '' : 'opacity-60'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`
          w-3 h-3 rounded-full 
          ${group.isActive ? 'bg-green-400' : 'bg-gray-400'}
        `} />
      </div>

      {/* Group Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-white">
            {group.name}
          </h3>
          {group.isFull && (
            <span className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-300">
              Full
            </span>
          )}
        </div>
        
        {/* Level Badge */}
        <div className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
          bg-gradient-to-r ${getLevelColor(group.level)}
        `}>
          {group.level}
        </div>
      </div>

      {/* Age Group Info */}
      <div className="mb-4">
        <div className="flex items-center text-blue-200 mb-2">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{ageGroupMeta.displayName}</span>
        </div>
        <p className="text-sm text-blue-300">
          Ages {ageGroupMeta.minAge}-{ageGroupMeta.maxAge} years
        </p>
      </div>

      {/* Capacity Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blue-200">Capacity</span>
          <span className={`text-sm font-medium ${getCapacityColor(utilizationPercentage)}`}>
            {group.currentPlayerCount}/{group.capacity} ({utilizationPercentage}%)
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              utilizationPercentage >= 90 ? 'bg-red-400' : 
              utilizationPercentage >= 75 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
            style={{ width: `${utilizationPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-blue-300 mt-1">
          {group.availableSpots} spots available
        </p>
      </div>

      {/* Coach Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-blue-200 mb-1">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM8 14a6 6 0 00-6 6 2 2 0 002 2h12a2 2 0 002-2 6 6 0 00-6-6H8z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Coach</span>
          </div>
          {showActions && group.coach && onRemoveCoach && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCoach(group.id);
              }}
              className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 transition-colors"
              title="Remove Coach"
            >
              Remove
            </button>
          )}
        </div>
        {group.coach ? (
          <p className="text-sm text-white">
            {group.coach.firstName} {group.coach.lastName}
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 italic">No coach assigned</p>
            {showActions && onAssignCoach && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignCoach(group.id);
                }}
                className="text-xs px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded text-purple-200 transition-colors"
              >
                Assign Coach
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zone Info */}
      {group.zone && (
        <div className="mb-4">
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Zone</span>
          </div>
          <p className="text-sm text-white">{group.zone}</p>
        </div>
      )}

      {/* Player Management Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-blue-200 mb-2">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="text-sm font-medium">Players</span>
          </div>
          {showActions && onAssignPlayer && !group.isFull && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignPlayer(group.id);
              }}
              className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-200 transition-colors"
            >
              Add Player
            </button>
          )}
        </div>
        <p className="text-sm text-white mb-2">
          {group.currentPlayerCount} / {group.capacity} players
        </p>
        
        {/* Players List */}
        {group.players && group.players.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {group.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between bg-white/5 rounded px-2 py-1">
                <span className="text-xs text-white">
                  {player.firstName} {player.lastName}
                </span>
                {showActions && (onUnassignPlayer || onReassignPlayer) && (
                  <div className="flex gap-1">
                    {onReassignPlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReassignClick(player);
                        }}
                        className="text-xs px-1 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 transition-colors"
                        title={`Reassign ${player.firstName} ${player.lastName} to another group`}
                      >
                        ↗
                      </button>
                    )}
                    {onUnassignPlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnassignClick(player);
                        }}
                        className="text-xs px-1 py-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 transition-colors"
                        title={`Remove ${player.firstName} ${player.lastName} from group`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {group.players && group.players.length === 0 && (
          <p className="text-xs text-gray-400 italic">No players assigned</p>
        )}
      </div>

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
                onViewDetails(group.id);
              }}
              className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-200 text-sm font-medium transition-colors duration-200"
            >
              View Details
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(group.id);
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors duration-200"
              title="Edit Group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(group.id);
              }}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium transition-colors duration-200"
              title="Delete Group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 112 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Description */}
      {group.description && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-blue-300">{group.description}</p>
        </div>
      )}

      {/* Unassign Player Modal */}
      <UnassignPlayerModal
        isOpen={unassignModal.isOpen}
        onClose={handleUnassignClose}
        onConfirm={handleUnassignConfirm}
        player={unassignModal.player}
        groupName={group.name}
      />

      {/* Reassign Player Modal */}
      <ReassignPlayerModal
        isOpen={reassignModal.isOpen}
        onClose={handleReassignClose}
        onConfirm={handleReassignConfirm}
        player={reassignModal.player}
        currentGroupId={group.id}
        currentGroupName={group.name}
      />
    </div>
  );
}