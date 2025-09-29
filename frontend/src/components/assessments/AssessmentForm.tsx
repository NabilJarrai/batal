'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Save, Send, AlertCircle, User, Clock, FileText, Tag } from 'lucide-react';
import { 
  AssessmentFormData, 
  AssessmentCreateRequest, 
  AssessmentUpdateRequest,
  AssessmentPeriod,
  SkillScoreFormData,
  Assessment,
  ASSESSMENT_PERIODS,
  isAssessmentComplete,
  canFinalizeAssessment
} from '@/types/assessments';
import { Skill, SkillCategory, SKILL_CATEGORIES } from '@/types/skills';
import { SkillRatingInput } from './SkillRatingInput';
import { assessmentsAPI } from '@/lib/api/assessments';
import { skillsAPI } from '@/lib/api/skills';
import { playersAPI, usersAPI, groupsAPI } from '@/lib/api';

interface AssessmentFormProps {
  assessment?: Assessment;
  playerId?: number;
  onSave: (assessment: Assessment) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit' | 'view';
}

interface Player {
  id: number;
  fullName: string;
  email: string;
  level: string;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  assessment,
  playerId,
  onSave,
  onCancel,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<AssessmentFormData>({
    playerId: playerId || assessment?.playerId || null,
    assessmentDate: assessment?.assessmentDate || new Date().toISOString().split('T')[0],
    period: assessment?.period || AssessmentPeriod.MONTHLY,
    comments: assessment?.comments || '',
    coachNotes: assessment?.coachNotes || '',
    skillScores: {}
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const isReadOnly = mode === 'view' || (assessment?.isFinalized && mode !== 'create');
  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get current user and their assigned groups
        const currentUser = await usersAPI.getCurrentUser();
        const coachGroups = await groupsAPI.getCoachGroups(currentUser.id);
        
        // Get players from all assigned groups
        const allPlayers: Player[] = [];
        for (const group of coachGroups) {
          const groupPlayers = await playersAPI.getByGroup(group.id);
          allPlayers.push(...groupPlayers);
        }

        setPlayers(allPlayers);

        // For existing assessments, load the skills and scores
        if (assessment) {
          // Load skills for the assessment's player level
          const assessmentPlayer = allPlayers.find(p => p.id === assessment.playerId);
          if (assessmentPlayer?.level) {
            const skillsData = await skillsAPI.getSkillsForAssessment(assessmentPlayer.level as any);
            setSkills(skillsData);

            // Load existing skill scores
            const existingScores: { [skillId: number]: SkillScoreFormData } = {};
            assessment.skillScores.forEach(score => {
              existingScores[score.skillId] = {
                skillId: score.skillId,
                score: score.score,
                notes: score.notes || ''
              };
            });

            // Add any missing skills with zero scores
            skillsData.forEach(skill => {
              if (!existingScores[skill.id]) {
                existingScores[skill.id] = {
                  skillId: skill.id,
                  score: 0,
                  notes: ''
                };
              }
            });

            setFormData(prev => ({ ...prev, skillScores: existingScores }));
            setIsDraft(!assessment.isFinalized);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isCreating, assessment]);

  // Find selected player when playerId changes and load skills by player level
  useEffect(() => {
    const updatePlayerAndSkills = async () => {
      if (formData.playerId && players.length > 0) {
        const player = players.find(p => p.id === formData.playerId);
        setSelectedPlayer(player || null);

        // Load skills based on player's level
        if (player?.level) {
          try {
            const skillsForLevel = await skillsAPI.getSkillsForAssessment(player.level as any);
            setSkills(skillsForLevel);

            // Initialize skill scores for new assessments or when player changes
            if (isCreating || !assessment) {
              const initialScores: { [skillId: number]: SkillScoreFormData } = {};
              skillsForLevel.forEach(skill => {
                initialScores[skill.id] = {
                  skillId: skill.id,
                  score: 0,
                  notes: ''
                };
              });
              setFormData(prev => ({ ...prev, skillScores: initialScores }));
            }
          } catch (err) {
            console.error('Failed to load skills for player level:', err);
            setError('Failed to load skills for selected player');
          }
        }
      } else if (!formData.playerId) {
        // Clear skills and selected player when no player is selected
        setSelectedPlayer(null);
        setSkills([]);
        if (isCreating) {
          setFormData(prev => ({ ...prev, skillScores: {} }));
        }
      }
    };

    updatePlayerAndSkills();
  }, [formData.playerId, players, isCreating, assessment]);

  const handleInputChange = (field: keyof AssessmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSkillScoreChange = (skillId: number, scoreData: SkillScoreFormData) => {
    setFormData(prev => ({
      ...prev,
      skillScores: {
        ...prev.skillScores,
        [skillId]: scoreData
      }
    }));
    setHasChanges(true);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.playerId) {
      errors.push('Please select a player');
    }
    
    if (!formData.assessmentDate) {
      errors.push('Please select an assessment date');
    }
    
    const hasAnyScore = Object.values(formData.skillScores).some(score => score.score > 0);
    if (!hasAnyScore && !isDraft) {
      errors.push('Please provide at least one skill rating before finalizing');
    }
    
    return errors;
  };

  const isAssessmentEmpty = (): boolean => {
    const hasAnyScore = Object.values(formData.skillScores).some(score => score.score > 0);
    const hasComments = formData.comments.trim() !== '';
    const hasCoachNotes = formData.coachNotes.trim() !== '';
    const hasNotes = Object.values(formData.skillScores).some(score => score.notes.trim() !== '');
    
    return !hasAnyScore && !hasComments && !hasCoachNotes && !hasNotes;
  };

  const handleSave = async (finalize: boolean = false) => {
    if (isReadOnly) return;
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0 && (finalize || !isDraft)) {
      setError(validationErrors.join(', '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const skillRatingsArray = Object.values(formData.skillScores)
        .filter(score => score.score > 0 || score.notes?.trim())
        .map(score => ({
          skillId: score.skillId,
          score: score.score,
          notes: score.notes?.trim() || undefined
        }));

      let result: Assessment;

      if (isEditing && assessment) {
        const updateData: AssessmentUpdateRequest = {
          assessmentDate: formData.assessmentDate,
          period: formData.period,
          comments: formData.comments?.trim() || undefined,
          coachNotes: formData.coachNotes?.trim() || undefined,
          skillRatings: skillRatingsArray,
          isFinalized: finalize
        };
        result = await assessmentsAPI.update(assessment.id, updateData);
      } else {
        const createData: AssessmentCreateRequest = {
          playerId: formData.playerId!,
          assessmentDate: formData.assessmentDate,
          period: formData.period,
          comments: formData.comments?.trim() || undefined,
          coachNotes: formData.coachNotes?.trim() || undefined,
          skillRatings: skillRatingsArray,
          isFinalized: finalize
        };
        result = await assessmentsAPI.create(createData);
      }

      setHasChanges(false);
      setIsDraft(!finalize);
      onSave(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges || isReadOnly || !formData.playerId) return;
    
    try {
      await handleSave(false);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000);
    return () => clearInterval(interval);
  }, [hasChanges, formData]);

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<SkillCategory, Skill[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent-teal/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">
                {isCreating ? 'New Assessment' : isEditing ? 'Edit Assessment' : 'View Assessment'}
              </h2>
              {selectedPlayer && (
                <p className="text-text-secondary text-lg">
                  {selectedPlayer.fullName} • {selectedPlayer.level} Level
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isDraft && !isReadOnly && (
                <span className="px-3 py-1 bg-accent-yellow/20 text-accent-yellow rounded-full text-sm font-medium">
                  Draft
                </span>
              )}
              {assessment?.isFinalized && (
                <span className="px-3 py-1 bg-accent-teal/20 text-accent-teal rounded-full text-sm font-medium">
                  Finalized
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Basic Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Player Selection
              </label>
              <select
                value={formData.playerId || ''}
                onChange={(e) => handleInputChange('playerId', parseInt(e.target.value) || null)}
                disabled={isReadOnly || isEditing}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-secondary"
              >
                <option value="">Select a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id} className="bg-white text-text-primary">
                    {player.fullName} ({player.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Assessment Date
              </label>
              <input
                type="date"
                value={formData.assessmentDate}
                onChange={(e) => handleInputChange('assessmentDate', e.target.value)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Assessment Period
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleInputChange('period', e.target.value as AssessmentPeriod)}
                disabled={isReadOnly}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-secondary"
              >
                {ASSESSMENT_PERIODS.map(period => (
                  <option key={period.key} value={period.key} className="bg-white text-text-primary">
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Skill Ratings by Category */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-accent-teal/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent-teal" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Skill Ratings</h3>
          </div>

          {!formData.playerId ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">Select a player to load skills</p>
              <p className="text-text-secondary">Skills will be loaded based on the player's level</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-text-secondary text-lg">Loading skills...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {SKILL_CATEGORIES.map(category => {
                const categorySkills = skillsByCategory[category.key] || [];
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category.key} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-text-primary">{category.label}</h4>
                        <span className="text-sm text-text-secondary">{categorySkills.length} skills to evaluate</span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {categorySkills.map(skill => (
                        <SkillRatingInput
                          key={skill.id}
                          skill={skill}
                          value={formData.skillScores[skill.id] || { skillId: skill.id, score: 0, notes: '' }}
                          onChange={handleSkillScoreChange}
                          disabled={isReadOnly}
                          showDescription={false}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-accent-yellow/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent-yellow" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Comments & Notes</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                General Comments
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                disabled={isReadOnly}
                placeholder="Share your overall assessment of the player's performance..."
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none disabled:bg-gray-50 disabled:text-text-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Private Coach Notes
              </label>
              <textarea
                value={formData.coachNotes}
                onChange={(e) => handleInputChange('coachNotes', e.target.value)}
                disabled={isReadOnly}
                placeholder="Add private notes, development recommendations, or areas for improvement..."
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none disabled:bg-gray-50 disabled:text-text-secondary"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <div className="flex items-center gap-2 text-accent-yellow">
                    <div className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                )}
                <span className="text-sm text-text-secondary">
                  {saving ? 'Saving...' : 'Auto-saves every 30 seconds'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-6 py-3 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleSave(false)}
                  disabled={saving || isAssessmentEmpty()}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-text-primary rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Save size={18} />
                  Save Draft
                </button>

                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || isAssessmentEmpty()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 font-medium"
                >
                  <Send size={18} />
                  {saving ? 'Finalizing...' : 'Finalize Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};