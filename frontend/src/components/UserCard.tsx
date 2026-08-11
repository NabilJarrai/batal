"use client";

import { useState } from 'react';
import { UserResponse, UserType, getParentInviteStatus } from '@/types/users';

interface UserCardProps {
  user: UserResponse;
  onEdit?: (userId: number) => void;
  onDeactivate?: (userId: number) => void;
  onActivate?: (userId: number) => void;
  onDelete?: (userId: number) => void;
  onViewDetails?: (userId: number) => void;
  /**
   * Create a new player under this parent. Players are attached to a parent
   * when they are created, so there is no linking of existing players.
   */
  onAddPlayer?: (userId: number) => void;
  onUnassignChild?: (userId: number, playerId: number) => void;
  onResendSetupEmail?: (userId: number) => void;
  onResetPassword?: (userId: number) => void;
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
  onAddPlayer,
  onUnassignChild,
  onResendSetupEmail,
  onResetPassword,
  showActions = true,
  isSelectable = false,
  isSelected = false,
  onSelect,
  assignedGroupsCount = 0,
  assignedGroupNames = []
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const inviteStatus = getParentInviteStatus(user);

  const getUserTypeColor = (userType?: UserType) => {
    switch (userType) {
      case UserType.MANAGER:
        return 'from-accent-red to-accent-red/80';
      case UserType.ADMIN:
        return 'from-secondary to-secondary-600';
      case UserType.COACH:
        return 'from-primary to-primary-hover';
      case UserType.PARENT:
        return 'from-blue-500 to-blue-600';
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
        {isSelectable && (
          <div className="flex-shrink-0 pt-3">
            {/* Stops propagation so the card's own click handler does not
                toggle the selection a second time and undo this one. */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(user.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${user.firstName} ${user.lastName}`}
              className="w-5 h-5 rounded border-border bg-surface text-primary focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </div>
        )}

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
      {(user.userType || !user.passwordSetAt) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {user.userType && (
            <div className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white
              bg-gradient-to-r ${getUserTypeColor(user.userType)}
            `}>
              {user.userType}
            </div>
          )}
          {/* Accounts are active from creation, so "active" does not mean they
              can sign in. These say how far through onboarding someone is.
              "Not invited" and "Pending setup" are kept apart because they need
              different things: the first is waiting on the academy to send the
              email, the second is waiting on the account holder to act on it. */}
          {inviteStatus === 'not_invited' && (
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30"
              title="No welcome email has been sent yet, so this person does not know the account exists"
            >
              Not invited
            </div>
          )}
          {inviteStatus === 'invited' && (
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-accent-yellow border border-yellow-500/30"
              title="Welcome email sent, but they have not set a password yet so they cannot sign in"
            >
              Pending setup
            </div>
          )}
        </div>
      )}

      {/* Coach Assignment Indicator */}
      {(user.userType === UserType.COACH || user.roles?.includes('COACH')) && assignedGroupsCount > 0 && (
        <div className="mb-4">
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              <span className="text-sm font-medium text-primary">
                Assigned to {assignedGroupsCount} group{assignedGroupsCount > 1 ? 's' : ''}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Cannot Delete
              </span>
            </div>
            {assignedGroupNames.length > 0 && (
              <p className="text-xs text-primary">
                Groups: {assignedGroupNames.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Parent Children Indicator */}
      {(user.userType === UserType.PARENT || user.roles?.includes('PARENT')) && (
        <div className="mb-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-sm font-medium text-blue-400">
                  Children ({user.children?.length || 0})
                </span>
              </div>
              {onAddPlayer && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPlayer(user.id);
                  }}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded transition-colors"
                >
                  + Add Player
                </button>
              )}
            </div>
            {user.children && user.children.length > 0 ? (
              <div className="space-y-2 mt-2">
                {user.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between bg-background/50 rounded p-2">
                    <div className="flex-1">
                      <p className="text-sm text-text-primary">
                        {child.firstName} {child.lastName}
                      </p>
                      <div className="flex gap-2 text-xs text-text-secondary">
                        {child.groupName && <span>Group: {child.groupName}</span>}
                        {child.level && <span>Level: {child.level}</span>}
                      </div>
                    </div>
                    {onUnassignChild && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${child.firstName} ${child.lastName} from this parent?`)) {
                            onUnassignChild(user.id, child.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Remove child"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-blue-400/60 mt-1">No children assigned</p>
            )}
          </div>
        </div>
      )}

      {/* Roles */}
      {user.roles && user.roles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-primary mb-2">
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
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
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Title</span>
          </div>
          <p className="text-sm text-text-primary">{user.title}</p>
        </div>
      )}

      {/* Joining Date */}
      {user.createdAt && (
        <div className="mb-4">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Joined</span>
          </div>
          <p className="text-sm text-text-primary">
            {new Date(user.createdAt).toLocaleDateString()}
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
          flex flex-wrap gap-1.5 mt-6 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-70'}
        `}>
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(user.id);
              }}
              className="btn-outline btn-xs flex-1 whitespace-nowrap"
            >
              View Details
            </button>
          )}

          {onResendSetupEmail && !user.passwordSetAt && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResendSetupEmail(user.id);
              }}
              className="btn-primary btn-xs whitespace-nowrap"
              title={
                inviteStatus === 'not_invited'
                  ? 'Send the welcome email with their password setup link'
                  : 'Resend password setup email'
              }
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {inviteStatus === 'not_invited' ? 'Send Invite' : 'Resend Email'}
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user.id);
              }}
              className="btn-secondary btn-xs"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}

          {onResetPassword && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword(user.id);
              }}
              className="btn-secondary btn-xs whitespace-nowrap"
              title="Set a new password for this user"
            >
              Reset Password
            </button>
          )}

          {user.isActive && onDeactivate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(user.id);
              }}
              className="btn-destructive btn-xs whitespace-nowrap"
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
              className="btn-success btn-xs whitespace-nowrap"
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
              className={`btn-xs ${assignedGroupsCount > 0 ? 'btn-disabled' : 'btn-destructive'}`}
              title={assignedGroupsCount > 0 ? `Cannot delete: Coach is assigned to ${assignedGroupsCount} group(s)` : "Delete Coach"}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Address */}
      {user.address && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center text-primary mb-1">
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
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
