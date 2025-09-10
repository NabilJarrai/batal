'use client';

import { Skill, getCategoryInfo, getLevelInfo } from '@/types/skills';
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
  const levelInfo = getLevelInfo(skill.applicableLevel);

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
      bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 transition-all duration-200 
      ${isDragging ? 'opacity-50 scale-95' : 'hover:bg-white/15 hover:border-white/30'}
      ${!skill.isActive ? 'opacity-60' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg
            ${categoryInfo?.color || 'bg-gray-500'}
          `}>
            {categoryInfo?.icon || '🎯'}
          </div>
          
          <div>
            <h3 className={`font-semibold ${skill.isActive ? 'text-white' : 'text-gray-300'}`}>
              {skill.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${categoryInfo?.color || 'bg-gray-500'} text-white
              `}>
                {categoryInfo?.label || skill.category}
              </span>
              <span className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${levelInfo?.color || 'bg-gray-500'} text-white
              `}>
                {levelInfo?.label || skill.applicableLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {!skill.isActive && (
            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full">
              Inactive
            </span>
          )}
          <div className={`
            w-2 h-2 rounded-full
            ${skill.isActive ? 'bg-green-400' : 'bg-red-400'}
          `} />
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {skill.description}
        </p>
      )}

      {/* Usage Stats */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-blue-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Used in {skill.usageCount} assessment{skill.usageCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-1 text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>Order #{skill.displayOrder}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            {/* Toggle Active */}
            <button
              onClick={() => onToggleActive?.(skill)}
              className={`
                px-3 py-1 text-xs rounded-lg font-medium transition-colors
                ${skill.isActive 
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                }
              `}
            >
              {skill.isActive ? 'Deactivate' : 'Activate'}
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit?.(skill)}
              className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg font-medium transition-colors"
            >
              Edit
            </button>
          </div>

          {/* Delete */}
          {skill.canDelete ? (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={handleDeleteClick}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-300">Confirm?</span>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-600 text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>In use</span>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Created: {new Date(skill.createdAt).toLocaleDateString()}</span>
          {skill.updatedAt !== skill.createdAt && (
            <span>Updated: {new Date(skill.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}