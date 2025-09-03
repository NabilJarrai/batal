"use client";

import { useState } from 'react';
import { UserResponse, UserType } from '@/types/users';

interface UserCardProps {
  user: UserResponse;
  onEdit?: (userId: number) => void;
  onDeactivate?: (userId: number) => void;
  onActivate?: (userId: number) => void;
  onViewDetails?: (userId: number) => void;
  showActions?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (userId: number) => void;
}

export default function UserCard({
  user,
  onEdit,
  onDeactivate,
  onActivate,
  onViewDetails,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getUserTypeColor = (userType?: UserType) => {
    switch (userType) {
      case UserType.MANAGER:
        return 'from-red-500 to-red-600';
      case UserType.ADMIN:
        return 'from-purple-500 to-purple-600';
      case UserType.COACH:
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
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
        relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6
        transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl
        ${isSelectable ? 'cursor-pointer' : ''}
        ${isSelected ? 'ring-2 ring-cyan-400 bg-white/20' : ''}
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
          ${user.isActive ? 'bg-green-400' : 'bg-red-400'}
        `} />
      </div>

      {/* User Avatar & Info */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-blue-200 truncate">
            {user.email}
          </p>
          {user.phone && (
            <p className="text-sm text-blue-300">
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

      {/* Roles */}
      {user.roles && user.roles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-blue-200 mb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Roles</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {user.roles.map((role, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/10 rounded-md text-xs text-blue-200"
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
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Title</span>
          </div>
          <p className="text-sm text-white">{user.title}</p>
        </div>
      )}

      {/* Joining Date */}
      {user.joiningDate && (
        <div className="mb-4">
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Joined</span>
          </div>
          <p className="text-sm text-white">
            {new Date(user.joiningDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Inactive Reason */}
      {!user.isActive && user.inactiveReason && (
        <div className="mb-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-200">
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
              className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-200 text-sm font-medium transition-colors duration-200"
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
              className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-colors duration-200"
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
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 text-sm font-medium transition-colors duration-200"
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
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-200 text-sm font-medium transition-colors duration-200"
            >
              Activate
            </button>
          )}
        </div>
      )}

      {/* Address */}
      {user.address && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center text-blue-200 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Address</span>
          </div>
          <p className="text-sm text-blue-300">{user.address}</p>
        </div>
      )}
    </div>
  );
}