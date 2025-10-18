"use client";

import { useState } from "react";
import { useAuth } from "@/store/hooks";
import { selectChild } from "@/store/authSlice";
import type { ChildSummary } from "@/types/auth";

export default function ChildSelector() {
  const { children, selectedChildId, dispatch } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no children
  if (!children || children.length === 0) {
    return null;
  }

  const selectedChild =
    children.find((child) => child.id === selectedChildId) || children[0];

  const handleChildSelect = (childId: number) => {
    dispatch(selectChild(childId));
    setIsExpanded(false);
  };

  // Single child - show compact view
  if (children.length === 1) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide px-1">
          Your Child
        </p>
        <ChildCard
          child={children[0]}
          isSelected={true}
          onClick={() => {}}
          isCompact={true}
        />
      </div>
    );
  }

  // Multiple children - show expandable selector
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Your Children ({children.length})
        </p>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {isExpanded ? "Collapse" : "Switch Child"}
        </button>
      </div>

      {/* Selected child - always visible and compact */}
      <ChildCard
        child={selectedChild}
        isSelected={true}
        onClick={() => setIsExpanded(!isExpanded)}
        isCompact={true}
      />

      {/* Other children - show when expanded */}
      {isExpanded && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          {children
            .filter((child) => child.id !== selectedChildId)
            .map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                isSelected={false}
                onClick={() => handleChildSelect(child.id)}
                isCompact={true}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// Child Card Component
interface ChildCardProps {
  child: ChildSummary;
  isSelected: boolean;
  onClick: () => void;
  isCompact: boolean;
}

function ChildCard({ child, isSelected, onClick, isCompact }: ChildCardProps) {
  const groupTheme = getGroupTheme(child.groupName);
  const age = calculateAge(child.dateOfBirth);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl transition-all duration-300
        ${
          isSelected
            ? "bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary shadow-lg shadow-primary/10 scale-100"
            : "bg-surface border border-border hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
        }
        ${isCompact ? "p-2" : "p-3"}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with group theme - Always compact */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-bold w-10 h-10 text-base"
          style={{
            backgroundColor: groupTheme.bgColor,
            color: groupTheme.textColor,
          }}
        >
          {groupTheme.icon ? (
            <span className="text-lg">{groupTheme.icon}</span>
          ) : (
            <span>
              {child.firstName[0]}
              {child.lastName[0]}
            </span>
          )}
        </div>

        {/* Child Info */}
        <div className="flex-1 min-w-0">
          {/* Name - Always compact, showing just first and last name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-text-primary truncate text-sm">
              {child.firstName} {child.lastName}
            </h3>
          </div>

          {/* Show essential info for selected child only */}
          {isSelected && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {age} years
              </span>

              {child.groupName && (
                <>
                  <span>•</span>
                  <span
                    className="font-medium flex items-center gap-1"
                    style={{ color: groupTheme.textColor }}
                  >
                    {groupTheme.emoji && (
                      <span className="text-sm">{groupTheme.emoji}</span>
                    )}
                    <span className="text-xs">{child.groupName}</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// Get theme colors and icons for each group
function getGroupTheme(groupName?: string) {
  const themes: Record<
    string,
    { bgColor: string; textColor: string; emoji: string; icon?: string }
  > = {
    Cookies: {
      bgColor: "#FEF3C7",
      textColor: "#92400E",
      emoji: "🍪",
      icon: "🍪",
    },
    Dolphins: {
      bgColor: "#DBEAFE",
      textColor: "#1E40AF",
      emoji: "🐬",
      icon: "🐬",
    },
    Tigers: {
      bgColor: "#FED7AA",
      textColor: "#9A3412",
      emoji: "🐯",
      icon: "🐯",
    },
    Lions: {
      bgColor: "#FEE2E2",
      textColor: "#991B1B",
      emoji: "🦁",
      icon: "🦁",
    },
  };

  return (
    themes[groupName || ""] || {
      bgColor: "#E0E7FF",
      textColor: "#3730A3",
      emoji: "⚽",
      icon: "⚽",
    }
  );
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}
