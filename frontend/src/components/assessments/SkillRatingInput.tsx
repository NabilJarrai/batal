'use client';

import React, { useState, useEffect } from 'react';
import { Star, Info } from 'lucide-react';
import { SkillScoreFormData, getScoreColor, getScoreLabel } from '@/types/assessments';
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
  const [showNotes, setShowNotes] = useState<boolean>(false);

  const handleScoreChange = (score: number) => {
    if (disabled) return;
    
    onChange(skill.id, {
      ...value,
      skillId: skill.id,
      score
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange(skill.id, {
      ...value,
      skillId: skill.id,
      notes
    });
  };

  const currentScore = hoveredScore || value.score;
  const scoreLabel = getScoreLabel(currentScore);
  const scoreColor = getScoreColor(currentScore);

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
      <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-white truncate">{skill.name}</div>
          {skill.description && (
            <div className="text-xs text-blue-300 truncate">{skill.description}</div>
          )}
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
        
        <div className={`text-sm font-medium min-w-16 text-white`}>
          {currentScore > 0 ? `${currentScore}/10` : '-'}
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
            {skill.description && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <Info size={16} />
              </button>
            )}
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

      {/* Slider Alternative */}
      <div className="space-y-2">
        <label className="text-sm text-blue-200">Score: {value.score}/10</label>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={value.score}
          onChange={(e) => handleScoreChange(parseInt(e.target.value))}
          disabled={disabled}
          className={`w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } slider`}
        />
        <div className="flex justify-between text-xs text-blue-300">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-blue-200">Notes (Optional)</label>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showNotes ? 'Hide' : 'Add Notes'}
          </button>
        </div>
        
        {showNotes && (
          <textarea
            value={value.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            disabled={disabled}
            placeholder="Add specific observations or comments about this skill..."
            rows={3}
            className={`w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm ${
              disabled ? 'bg-white/5 cursor-not-allowed' : ''
            }`}
          />
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(
            to right,
            #ef4444 0%,
            #f97316 30%,
            #eab308 60%,
            #22c55e 100%
          );
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(
            to right,
            #ef4444 0%,
            #f97316 30%,
            #eab308 60%,
            #22c55e 100%
          );
        }
      `}</style>
    </div>
  );
};