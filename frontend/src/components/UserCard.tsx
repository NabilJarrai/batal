"use client";

import { useState } from 'react';
import { UserResponse, UserType } from '@/types/users';

interface UserCardProps {
  user: UserResponse;
  onEdit?: (userId: number) => void;
  onDeactivate?: (userId: number) => void;
  onActivate?: (userId: number) => void;
  onDelete?: (userId: number) => void;
  onViewDetails?: (userId: number) => void;
  showActions?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (userId: number) => void;
  assignedGroupsCount?: number;
  assignedGroupNames?: string[];
}

export default function UserCard({
  user,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  onViewDetails,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect,
  assignedGroupsCount = 0,
  assignedGroupNames = []
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getUserTypeColor = (userType?: UserType) => {
    switch (userType) {
      case UserType.MANAGER:
        return 'from-accent-red to-accent-red/80';
      case UserType.ADMIN:
        return 'from-secondary to-secondary-600';
      case UserType.COACH:
        return 'from-primary to-primary-hover';
      default:
        return 'from-secondary to-secondary-600';
    }
  };

  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(user.id);
    } else if (onViewDetails) {
      onViewDetails(user.id);
    }
  };

  return (
    <div
      className={`
        card-base p-6 relative
        ${isSelectable ? 'card-interactive' : 'card-hover'}
        ${isSelected ? 'card-selected' : ''}
        ${user.isActive ? '' : 'opacity-60'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`
          w-3 h-3 rounded-full
          ${user.isActive ? 'bg-accent-teal' : 'bg-accent-red'}
        `} />
      </div>

      {/* User Avatar & Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 bg-gradient-to-br ${getUserTypeColor(user.userType)} rounded-full flex items-center justify-center`}>
            <span className="text-white font-semibold text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary truncate">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-primary truncate">
            {user.email}
          </p>
          {user.phone && (
            <p className="text-sm text-text-secondary">
              {user.phone}
            </p>
          )}
        </div>
      </div>

      {/* User Type Badge */}
      {user.userType && (
        <div className="mb-4">
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
            bg-gradient-to-r ${getUserTypeColor(user.userType)}
          `}>
            {user.userType}
          </div>
        </div>
      )}

      {/* Coach Assignment Indicator */}
      {(user.userType === UserType.COACH || user.roles?.includes('COACH')) && assignedGroupsCount > 0 && (
        <div className="mb-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                Assigned to {assignedGroupsCount} group{assignedGroupsCount > 1 ? 's' : ''}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Cannot Delete
              </span>
            </div>
            {assignedGroupNames.length > 0 && (
              <p className="text-xs text-blue-600">
                Groups: {assignedGroupNames.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Roles */}
      {user.roles && user.roles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-primary mb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Roles</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary-100 rounded-md text-xs text-primary"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      {user.title && (
        <div className="mb-4">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Title</span>
          </div>
          <p className="text-sm text-text-primary">{user.title}</p>
        </div>
      )}

      {/* Joining Date */}
      {user.joiningDate && (
        <div className="mb-4">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Joined</span>
          </div>
          <p className="text-sm text-text-primary">
            {new Date(user.joiningDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Inactive Reason */}
      {!user.isActive && user.inactiveReason && (
        <div className="mb-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-accent-red">
              <strong>Inactive:</strong> {user.inactiveReason}
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
                onViewDetails(user.id);
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
                onEdit(user.id);
              }}
              className="btn-secondary btn-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}

          {user.isActive && onDeactivate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(user.id);
              }}
              className="btn-destructive btn-sm"
            >
              Deactivate
            </button>
          )}

          {!user.isActive && onActivate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActivate(user.id);
              }}
              className="btn-success btn-sm"
            >
              Activate
            </button>
          )}

          {onDelete && (user.userType === UserType.COACH || user.roles?.includes('COACH')) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (assignedGroupsCount === 0) {
                  onDelete(user.id);
                }
              }}
              disabled={assignedGroupsCount > 0}
              className={`btn-sm ${assignedGroupsCount > 0 ? 'btn-disabled' : 'btn-destructive'}`}
              title={assignedGroupsCount > 0 ? `Cannot delete: Coach is assigned to ${assignedGroupsCount} group(s)` : "Delete Coach"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Address */}
      {user.address && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Address</span>
          </div>
          <p className="text-sm text-text-secondary">{user.address}</p>
        </div>
      )}
    </div>
  );
}