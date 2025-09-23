'use client';

import { Skill, getCategoryInfo, getLevelsDisplayText, SKILL_LEVELS } from '@/types/skills';
import { useState } from 'react';

interface SkillCardProps {
  skill: Skill;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
  onToggleActive?: (skill: Skill) => void;
  showActions?: boolean;
  isDragging?: boolean;
}

export default function SkillCard({
  skill,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
  isDragging = false
}: SkillCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryInfo = getCategoryInfo(skill.category);
  const levelsDisplayText = getLevelsDisplayText(skill.applicableLevels);

  const handleDeleteClick = () => {
    if (skill.canDelete) {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    onDelete?.(skill);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`
      card-base p-4 relative group
      ${skill.isActive ? 'card-hover' : 'opacity-60'}
      ${isDragging ? 'opacity-50 scale-95' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            relative w-12 h-12 rounded-xl flex items-center justify-center text-xl
            ${categoryInfo?.color || 'bg-gray-500'}
            shadow-lg transition-transform duration-300 group-hover:scale-110
            before:absolute before:inset-0 before:rounded-xl before:bg-white/20 before:opacity-0
            group-hover:before:opacity-100 before:transition-opacity before:duration-300
          `}>
            <span className="relative z-10">{categoryInfo?.icon || '🎯'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight mb-2 text-text-primary">
              {skill.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                ${skill.isActive
                  ? categoryInfo?.color || 'bg-gray-600'
                  : 'bg-gray-400 text-gray-100'
                }
                text-white border-0 transition-all duration-300
                group-hover:scale-105 group-hover:shadow-lg
              `}>
                <span className="text-sm">{categoryInfo?.emoji || '🎯'}</span>
                <span>{categoryInfo?.label || skill.category}</span>
              </div>
              <div className="flex gap-1">
                {skill.applicableLevels?.map((level) => {
                  const levelInfo = SKILL_LEVELS.find(l => l.key === level);
                  return (
                    <div key={level} className={`
                      inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                      ${skill.isActive
                        ? levelInfo?.color || 'bg-gray-600'
                        : 'bg-gray-400'
                      }
                      text-white border-0 transition-all duration-300
                      group-hover:scale-105
                    `}>
                      <span className="text-xs">{levelInfo?.icon || '🎯'}</span>
                      <span>{levelInfo?.shortLabel || level}</span>
                    </div>
                  );
                }) || (
                  <span className="text-xs px-2 py-1 rounded-md font-medium bg-gray-500 text-white">
                    {levelsDisplayText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col items-end gap-2">
          <div className={`
            relative w-3 h-3 rounded-full transition-all duration-300
            ${skill.isActive
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/30'
              : 'bg-gradient-to-r from-red-400 to-red-500 shadow-lg shadow-red-400/30'
            }
            after:absolute after:inset-0 after:rounded-full after:animate-pulse
            ${skill.isActive ? 'after:bg-green-400/50' : 'after:bg-red-400/50'}
          `} />
          {!skill.isActive && (
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-lg border border-red-400/30 backdrop-blur-sm">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <div className="mb-4">
          <p className="text-sm leading-relaxed line-clamp-2 text-text-secondary">
            {skill.description}
          </p>
        </div>
      )}

      {/* Usage Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{skill.usageCount}</span>
            <span>assessment{skill.usageCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1 text-text-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="font-medium">#{skill.displayOrder}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Toggle Active */}
              <button
                onClick={() => onToggleActive?.(skill)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5 hover:scale-105
                  ${skill.isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={skill.isActive ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                  />
                </svg>
                {skill.isActive ? 'Deactivate' : 'Activate'}
              </button>

              {/* Edit */}
              <button
                onClick={() => onEdit?.(skill)}
                className="
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5
                  bg-blue-600 text-white hover:bg-blue-700 hover:scale-105
                "
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            </div>

            {/* Delete */}
            {skill.canDelete ? (
              <div className="relative">
                {!showDeleteConfirm ? (
                  <button
                    onClick={handleDeleteClick}
                    className="
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 flex items-center gap-1.5
                      bg-red-600 text-white hover:bg-red-700 hover:scale-105
                    "
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-300 font-medium">Confirm?</span>
                    <button
                      onClick={handleConfirmDelete}
                      className="
                        px-2 py-1 rounded-md text-xs font-medium transition-all duration-300
                        bg-red-600 text-white hover:bg-red-700
                      "
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="
                        px-2 py-1 rounded-md text-xs font-medium transition-all duration-300
                        bg-gray-600 text-white hover:bg-gray-700
                      "
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-white bg-amber-600 rounded-lg px-2 py-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">In use</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
          </div>
          {skill.updatedAt !== skill.createdAt && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>{new Date(skill.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}