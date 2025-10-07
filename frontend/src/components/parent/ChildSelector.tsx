"use client";

import { useAuth } from "@/store/hooks";
import { selectChild } from "@/store/authSlice";
import type { ChildSummary } from "@/types/auth";

export default function ChildSelector() {
  const { children, selectedChildId, dispatch } = useAuth();

  // Don't render if no children
  if (!children || children.length === 0) {
    return null;
  }

  // Don't render if only one child (no need to switch)
  if (children.length === 1) {
    return (
      <div className="bg-surface rounded-lg p-4 border border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-caption text-text-secondary">Viewing profile for</p>
            <p className="text-body font-medium text-text-primary">
              {children[0].firstName} {children[0].lastName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(child => child.id === selectedChildId);

  return (
    <div className="bg-surface rounded-lg p-4 border border-border">
      <label className="text-caption text-text-secondary mb-2 block">
        Select Child Profile
      </label>

      <div className="relative">
        <select
          value={selectedChildId || ''}
          onChange={(e) => dispatch(selectChild(Number(e.target.value)))}
          className="input-base w-full appearance-none pr-10"
        >
          {children.map((child: ChildSummary) => (
            <option key={child.id} value={child.id}>
              {child.firstName} {child.lastName}
              {child.groupName ? ` - ${child.groupName}` : ''}
              {child.level ? ` (${child.level})` : ''}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Selected child info */}
      {selectedChild && (
        <div className="mt-3 p-3 bg-background rounded-lg border border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-body font-semibold text-text-primary">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h3>
                {selectedChild.isActive ? (
                  <span className="badge-success">Active</span>
                ) : (
                  <span className="badge-error">Inactive</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-body-sm">
                {selectedChild.groupName && (
                  <div>
                    <span className="text-text-secondary">Group: </span>
                    <span className="text-text-primary font-medium">{selectedChild.groupName}</span>
                  </div>
                )}
                {selectedChild.level && (
                  <div>
                    <span className="text-text-secondary">Level: </span>
                    <span className="text-text-primary font-medium">{selectedChild.level}</span>
                  </div>
                )}
                {selectedChild.dateOfBirth && (
                  <div className="col-span-2">
                    <span className="text-text-secondary">Age: </span>
                    <span className="text-text-primary font-medium">
                      {calculateAge(selectedChild.dateOfBirth)} years
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar placeholder */}
            <div className="ml-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">
                {selectedChild.firstName[0]}{selectedChild.lastName[0]}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
