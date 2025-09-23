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
}

export const SkillRatingInput: React.FC<SkillRatingInputProps> = ({
  skill,
  value,
  onChange,
  disabled = false,
  showDescription = false,
  compact = false
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


  const currentScore = hoveredScore || value.score;
  const scoreLabel = getScoreLabel(currentScore);

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
      <div className="card-base p-4 space-y-4 group">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-text-primary">{skill.name}</div>
            {skill.description && (
              <div className="text-xs text-text-secondary mt-1 line-clamp-2">{skill.description}</div>
            )}
          </div>
          <div className="ml-4">
            <div className={`text-xl font-bold transition-all duration-300 ${
              currentScore > 0
                ? currentScore >= 8
                  ? 'text-green-300'
                  : currentScore >= 6
                    ? 'text-yellow-300'
                    : currentScore >= 4
                      ? 'text-orange-300'
                      : 'text-red-300'
                : 'text-gray-400'
            }`}>
              {currentScore > 0 ? `${currentScore}/10` : '-'}
            </div>
            {currentScore > 0 && (
              <div className="text-xs text-text-secondary text-center mt-1">
                {getScoreLabel(currentScore)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Rating</span>
            <div className="text-xs text-text-secondary">
              {currentScore > 0 ? getScoreLabel(currentScore) : 'No rating'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                disabled={disabled}
                onClick={() => handleScoreChange(score)}
                onMouseEnter={() => setHoveredScore(score)}
                onMouseLeave={() => setHoveredScore(0)}
                className={`
                  w-7 h-7 rounded-lg text-xs font-bold transition-all duration-300
                  flex items-center justify-center border
                  ${disabled
                    ? 'bg-secondary text-text-secondary cursor-not-allowed border-border'
                    : score <= currentScore
                      ? score >= 8
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400/30 hover:scale-110 shadow-lg shadow-green-500/30'
                        : score >= 6
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-yellow-400/30 hover:scale-110 shadow-lg shadow-yellow-500/30'
                          : score >= 4
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white border-orange-400/30 hover:scale-110 shadow-lg shadow-orange-500/30'
                            : 'bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400/30 hover:scale-110 shadow-lg shadow-red-500/30'
                      : 'bg-background text-text-secondary border-border hover:bg-secondary-50 hover:text-text-primary hover:scale-105'
                  }
                `}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="card-base p-6 space-y-6 group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-text-primary">{skill.name}</h3>
            <div className={`
              px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300
              ${currentScore > 0
                ? currentScore >= 8
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                  : currentScore >= 6
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                    : currentScore >= 4
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }
            `}>
              {currentScore > 0 ? getScoreLabel(currentScore) : 'Unrated'}
            </div>
          </div>

          {showDescription && skill.description && (
            <p className="text-sm text-text-secondary leading-relaxed">{skill.description}</p>
          )}
        </div>

        <div className="text-right ml-6">
          <div className={`font-bold text-2xl transition-all duration-300 ${
            currentScore > 0
              ? currentScore >= 8
                ? 'text-green-300'
                : currentScore >= 6
                  ? 'text-yellow-300'
                  : currentScore >= 4
                    ? 'text-orange-300'
                    : 'text-red-300'
              : 'text-gray-400'
          }`}>
            {currentScore > 0 ? `${currentScore}/10` : '-'}
          </div>
        </div>
      </div>

      {/* Rating System */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-text-primary">Rating</span>
          <div className="text-sm text-text-secondary">
            Click a number to rate
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => handleScoreChange(score)}
              onMouseEnter={() => setHoveredScore(score)}
              onMouseLeave={() => setHoveredScore(0)}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                transition-all duration-300 border relative group
                ${disabled
                  ? 'bg-secondary text-text-secondary cursor-not-allowed border-border'
                  : score <= currentScore
                    ? score >= 8
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400/30 shadow-xl shadow-green-500/40 scale-110'
                      : score >= 6
                        ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-yellow-400/30 shadow-xl shadow-yellow-500/40 scale-110'
                        : score >= 4
                          ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white border-orange-400/30 shadow-xl shadow-orange-500/40 scale-110'
                          : 'bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400/30 shadow-xl shadow-red-500/40 scale-110'
                    : 'bg-background text-text-secondary border-border hover:bg-secondary-50 hover:text-text-primary hover:scale-110'
                }
              `}
            >
              {score}
              {score <= currentScore && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/60 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
        
        {/* Scale Labels */}
        <div className="grid grid-cols-4 gap-2 text-xs text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full" />
            <span className="text-red-300 font-medium">Poor (1-3)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full" />
            <span className="text-orange-300 font-medium">Needs Work (4-5)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full" />
            <span className="text-yellow-300 font-medium">Good (6-7)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full" />
            <span className="text-green-300 font-medium">Excellent (8-10)</span>
          </div>
        </div>
      </div>
    </div>
  );
};