"use client";

import { useState } from 'react';
import { GroupResponse, AGE_GROUP_METADATA } from '@/types/groups';
import { Level } from '@/types/players';
import { PlayerDTO } from '@/types/players';

interface GroupCardProps {
  group: GroupResponse;
  onAssignCoach?: (groupId: number) => void;
  onAssignPlayer?: (groupId: number) => void;
  onRemoveCoach?: (groupId: number) => void;
  onRemovePlayer?: (groupId: number, playerId: number) => void;
  onViewDetails?: (groupId: number) => void;
  onEdit?: (groupId: number) => void;
  onDelete?: (groupId: number) => void;
  onAssignAssessment?: (groupId: number) => void;
  /** Opens the dialog listing this group's players, with bulk actions. */
  onViewPlayers?: (groupId: number) => void;
  onActivate?: (groupId: number) => void;
  onDeactivate?: (groupId: number) => void;
  showActions?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (groupId: number) => void;
}

// The three primary card actions share a width so they line up, since their
// labels differ in length and btn-xs alone only matches padding.
const CARD_ACTION_CLASS = 'btn-xs w-32 justify-center';

export default function GroupCard({ 
  group, 
  onAssignCoach,
  onAssignPlayer,
  onRemoveCoach,
  onRemovePlayer,
  onViewDetails, 
  onEdit,
  onDelete,
  onAssignAssessment,
  onViewPlayers,
  onActivate,
  onDeactivate,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect
}: GroupCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const ageGroupMeta = AGE_GROUP_METADATA[group.ageGroup];
  const utilizationPercentage = Math.round((group.currentPlayerCount / group.capacity) * 100);
  
  const getLevelColor = (level: Level) => {
    return level === Level.DEVELOPMENT 
      ? 'from-blue-500 to-blue-600' 
      : 'from-purple-500 to-purple-600';
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-accent-red';
    if (percentage >= 75) return 'text-accent-yellow';
    return 'text-accent-teal';
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
        card-base p-4 sm:p-6 relative
        ${isSelectable ? 'card-interactive' : 'card-hover'}
        ${isSelected ? 'card-selected' : ''}
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
          ${group.isActive ? 'bg-accent-teal' : 'bg-disabled'}
        `} />
      </div>

      {/* Group Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">
            {group.name}
          </h3>
          {group.isFull && (
            <span className="badge-error">
              Full
            </span>
          )}
        </div>
        
        {/* Level Badge */}
        <div className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium text-white
          bg-gradient-to-r ${getLevelColor(group.level)}
        `}>
          {group.level}
        </div>
      </div>

      {/* Age Group Info */}
      <div className="mb-3">
        <div className="flex items-center flex-wrap text-primary">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{ageGroupMeta.displayName}</span>
          <span className="text-sm text-primary ml-2">
            &bull; Ages {ageGroupMeta.minAge}-{ageGroupMeta.maxAge} years
          </span>
        </div>
      </div>

      {/* Capacity Info */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-primary">Capacity</span>
          <span className={`text-sm font-medium ${getCapacityColor(utilizationPercentage)}`}>
            {group.currentPlayerCount}/{group.capacity} ({utilizationPercentage}%)
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-secondary-50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              utilizationPercentage >= 90 ? 'bg-accent-red' : 
              utilizationPercentage >= 75 ? 'bg-accent-yellow' : 'bg-accent-teal'
            }`}
            style={{ width: `${utilizationPercentage}%` }}
          />
        </div>
        
        <p className="text-xs text-primary mt-1">
          {group.availableSpots} spots available
        </p>
      </div>

      {/* Coach Info */}
      <div className="mb-3">
        <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 text-primary">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM8 14a6 6 0 00-6 6 2 2 0 002 2h12a2 2 0 002-2 6 6 0 00-6-6H8z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Coach</span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {group.coach ? (
              <p className="text-sm text-text-primary truncate">
                {group.coach.firstName} {group.coach.lastName}
              </p>
            ) : (
              <p className="text-sm text-text-secondary italic">No coach assigned</p>
            )}

            {showActions && group.coach && onRemoveCoach && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCoach(group.id);
                }}
                className="btn-destructive btn-xs flex-shrink-0"
                title="Remove Coach"
              >
                Remove
              </button>
            )}
            {showActions && !group.coach && onAssignCoach && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignCoach(group.id);
                }}
                className={`btn-secondary ${CARD_ACTION_CLASS} flex-shrink-0`}
              >
                Assign Coach
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assessment. Without one, this group's players cannot be assessed at
          all, so its absence is called out rather than left blank. */}
      <div className="mb-3">
        <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-1 text-primary">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Assessment</span>
          </div>
        {group.assessmentTemplateTitle ? (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <p className="text-sm text-text-primary truncate">{group.assessmentTemplateTitle}</p>
            {showActions && onAssignAssessment && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignAssessment(group.id);
                }}
                className={`btn-secondary ${CARD_ACTION_CLASS} flex-shrink-0`}
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-accent-yellow">
              None &mdash; players cannot be assessed
            </p>
            {showActions && onAssignAssessment && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignAssessment(group.id);
                }}
                className={`btn-secondary ${CARD_ACTION_CLASS} flex-shrink-0`}
              >
                Assign Assessment
              </button>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Zone Info */}
      {group.zone && (
        <div className="mb-3">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Zone</span>
          </div>
          <p className="text-sm text-text-primary">{group.zone}</p>
        </div>
      )}

      {/* Player Management Section */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-primary mb-2">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="text-sm font-medium">Players</span>
          </div>
          {showActions && onAssignPlayer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Add Player button clicked for group:', group.id, group.name);
                if (onAssignPlayer) {
                  onAssignPlayer(group.id);
                } else {
                  console.error('onAssignPlayer is not defined');
                }
              }}
              className={`btn-success ${CARD_ACTION_CLASS}`}
            >
              Add Player
            </button>
          )}
        </div>
        <p className="text-sm text-text-primary mb-2">
          {group.currentPlayerCount} / {group.capacity} players
        </p>
        
        {/* The inline list did not scale: at twenty players it filled the
            card and buried the actions. The full list, search and bulk
            actions live in the players dialog instead. */}
        {showActions && onViewPlayers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewPlayers(group.id);
            }}
            disabled={group.currentPlayerCount === 0}
            className={`btn-secondary ${CARD_ACTION_CLASS} disabled:opacity-40 disabled:cursor-not-allowed`}
            title={
              group.currentPlayerCount === 0
                ? 'No players in this group yet'
                : 'View, move or remove this group\'s players'
            }
          >
            View Players
          </button>
        )}

        {group.currentPlayerCount === 0 && (
          <p className="text-xs text-text-secondary italic mt-2">No players assigned</p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className={`
          flex gap-2 mt-6 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-70'}
        `}>
          {/* Status toggle */}
          {(onActivate || onDeactivate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (group.isActive && onDeactivate) {
                  onDeactivate(group.id);
                } else if (!group.isActive && onActivate) {
                  onActivate(group.id);
                }
              }}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                group.isActive 
                  ? 'bg-accent-red/20 hover:bg-accent-red/30 border-accent-red/30 text-accent-red'
                  : 'bg-accent-teal/20 hover:bg-accent-teal/30 border-accent-teal/30 text-accent-teal'
              }`}
              title={group.isActive ? "Deactivate Group" : "Activate Group"}
            >
              {group.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(group.id);
              }}
              className="btn-outline btn-sm flex-1"
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
              className="btn-secondary btn-sm"
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
              className="btn-destructive btn-sm"
              title="Delete Group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Description */}
      {group.description && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-primary">{group.description}</p>
        </div>
      )}

    </div>
  );
}