'use client';

import React, { useState, useEffect } from 'react';
import { SkillScoreFormData, getScoreLabel } from '@/types/assessments';
import { Skill } from '@/types/skills';

interface SkillRatingInputProps {
  skill: Skill;
  value: SkillScoreFormData;
  onChange: (skillId: number, data: SkillScoreFormData) => void;
  disabled?: boolean;
  showDescription?: boolean;
  compact?: boolean;
  previousScore?: number | null;
}

export const SkillRatingInput: React.FC<SkillRatingInputProps> = ({
  skill,
  value,
  onChange,
  disabled = false,
  showDescription = false,
  compact = false,
  previousScore
}) => {
  const [hoveredScore, setHoveredScore] = useState<number>(0);

  const handleScoreChange = (score: number) => {
    if (disabled) return;
    
    onChange(skill.id, {
      ...value,
      skillId: skill.id,
      score
    });
  };


  // Hover is a preview of a rating you are about to give, so it must not apply
  // when the assessment is read-only: hovering a finalized score of 5 would
  // otherwise display 9/10 and misreport what was actually recorded.
  const currentScore = (disabled ? 0 : hoveredScore) || value.score;
  const scoreLabel = getScoreLabel(currentScore);

  /**
   * Fill colour for a filled cell, keyed on the cell's own position, so the
   * bar runs red -> orange -> yellow -> teal as it fills.
   *
   * Kept separate from the disabled state on purpose. Read-only assessments
   * still need to show which scores were given; disabling only removes the
   * interactive affordances, never the colour.
   */
  const fillClass = (score: number) =>
    score >= 8
      ? 'bg-accent-teal'
      : score >= 6
        ? 'bg-accent-yellow'
        : score >= 4
          ? 'bg-orange-500'
          : 'bg-accent-red';

  /** Halo on the larger cells, matching the fill. */
  const ringClass = (score: number) =>
    score >= 8
      ? 'ring-2 ring-accent-teal/20'
      : score >= 6
        ? 'ring-2 ring-accent-yellow/20'
        : score >= 4
          ? 'ring-2 ring-orange-200'
          : 'ring-2 ring-red-200';

  // Initialize if not set
  useEffect(() => {
    if (!value.skillId) {
      onChange(skill.id, {
        skillId: skill.id,
        score: 0,
        notes: ''
      });
    }
  }, [skill.id, value.skillId, onChange]);

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-text-primary text-sm truncate">{skill.name}</h4>
              {previousScore != null && (
                <span className="text-xs text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  Previous: {previousScore}
                </span>
              )}
            </div>
            {showDescription && skill.description && (
              <p className="text-xs text-text-secondary mt-1 line-clamp-1">{skill.description}</p>
            )}
          </div>
          <div className="ml-3 text-right flex-shrink-0">
            <div className={`text-lg font-bold transition-all ${
              currentScore > 0
                ? currentScore >= 8
                  ? 'text-accent-teal'
                  : currentScore >= 6
                    ? 'text-accent-yellow'
                    : currentScore >= 4
                      ? 'text-orange-500'
                      : 'text-accent-red'
                : 'text-gray-400'
            }`}>
              {currentScore > 0 ? `${currentScore}/10` : '—'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => handleScoreChange(score)}
              onMouseEnter={disabled ? undefined : () => setHoveredScore(score)}
              onMouseLeave={disabled ? undefined : () => setHoveredScore(0)}
              className={`
                h-8 w-full rounded text-xs font-semibold transition-all duration-200
                flex items-center justify-center
                ${disabled ? 'cursor-not-allowed' : ''}
                ${score <= currentScore
                  ? `${fillClass(score)} text-white ${disabled ? '' : 'hover:opacity-90'}`
                  : `bg-gray-100 ${disabled ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-200'}`
                }
              `}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-gray-200 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-xl text-text-primary">{skill.name}</h3>
            {previousScore != null && (
              <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                Previous: {previousScore}
              </span>
            )}
            <div className={`
              px-3 py-1 rounded-full text-xs font-semibold transition-all
              ${currentScore > 0
                ? currentScore >= 8
                  ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20'
                  : currentScore >= 6
                    ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20'
                    : currentScore >= 4
                      ? 'bg-orange-100 text-orange-600 border border-orange-200'
                      : 'bg-red-100 text-accent-red border border-red-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
              }
            `}>
              {currentScore > 0 ? getScoreLabel(currentScore) : 'Unrated'}
            </div>
          </div>

          {showDescription && skill.description && (
            <p className="text-sm text-text-secondary leading-relaxed bg-gray-50 rounded-lg p-3">{skill.description}</p>
          )}
        </div>

        <div className="text-right ml-6">
          <div className={`font-bold text-3xl transition-all ${
            currentScore > 0
              ? currentScore >= 8
                ? 'text-accent-teal'
                : currentScore >= 6
                  ? 'text-accent-yellow'
                  : currentScore >= 4
                    ? 'text-orange-500'
                    : 'text-accent-red'
              : 'text-gray-400'
          }`}>
            {currentScore > 0 ? `${currentScore}/10` : '—'}
          </div>
        </div>
      </div>

      {/* Rating System */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-text-primary">Rate this skill</span>
          <div className="text-sm text-text-secondary">
            {currentScore > 0 ? `Current: ${getScoreLabel(currentScore)}` : 'Click a number to rate'}
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => handleScoreChange(score)}
              onMouseEnter={disabled ? undefined : () => setHoveredScore(score)}
              onMouseLeave={disabled ? undefined : () => setHoveredScore(0)}
              className={`
                aspect-square rounded-xl text-sm font-bold transition-all duration-200
                flex items-center justify-center relative
                ${disabled ? 'cursor-not-allowed' : 'transform hover:scale-110'}
                ${score <= currentScore
                  ? `${fillClass(score)} ${ringClass(score)} text-white shadow-lg ${disabled ? '' : 'hover:shadow-xl'}`
                  : `bg-gray-100 ${disabled ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-200 hover:text-text-primary'}`
                }
              `}
            >
              {score}
            </button>
          ))}
        </div>

        {/* Scale Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="w-4 h-4 bg-accent-red rounded-full mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-600">Poor</span>
            <div className="text-xs text-gray-500">1-3</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-600">Needs Work</span>
            <div className="text-xs text-gray-500">4-5</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-accent-yellow rounded-full mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-600">Good</span>
            <div className="text-xs text-gray-500">6-7</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 bg-accent-teal rounded-full mx-auto mb-2" />
            <span className="text-xs font-medium text-gray-600">Excellent</span>
            <div className="text-xs text-gray-500">8-10</div>
          </div>
        </div>
      </div>
    </div>
  );
};