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
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-white">{skill.name}</div>
            {skill.description && (
              <div className="text-xs text-blue-300 mt-1">{skill.description}</div>
            )}
          </div>
          <div className="text-white font-medium ml-4">
            {currentScore > 0 ? `${currentScore}/10` : '-'}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-200">Rating</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                disabled={disabled}
                onClick={() => handleScoreChange(score)}
                onMouseEnter={() => setHoveredScore(score)}
                onMouseLeave={() => setHoveredScore(0)}
                className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${
                  disabled
                    ? 'bg-white/10 text-blue-300 cursor-not-allowed'
                    : score <= currentScore
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-white/20 text-blue-200 hover:bg-white/30'
                }`}
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
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{skill.name}</h3>
          </div>
          
          {showDescription && skill.description && (
            <p className="text-sm text-blue-200 mt-1">{skill.description}</p>
          )}
        </div>
        
        <div className={`text-right text-white`}>
          <div className="font-bold text-lg">
            {currentScore > 0 ? `${currentScore}/10` : '-'}
          </div>
          <div className="text-sm text-blue-200">{scoreLabel}</div>
        </div>
      </div>

      {/* Star Rating */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-200">Rating</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                disabled={disabled}
                onClick={() => handleScoreChange(score)}
                onMouseEnter={() => setHoveredScore(score)}
                onMouseLeave={() => setHoveredScore(0)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  disabled 
                    ? 'bg-white/10 text-blue-300 cursor-not-allowed'
                    : score <= currentScore
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                      : 'bg-white/20 text-blue-200 hover:bg-white/30'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-blue-300 px-1">
          <span>Poor (1-3)</span>
          <span>Needs Improvement (4-5)</span>
          <span>Good (6-7)</span>
          <span>Excellent (8-10)</span>
        </div>
      </div>
    </div>
  );
};