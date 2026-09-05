'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { assessmentTemplatesAPI } from '@/lib/api';
import { playersAPI, usersAPI, groupsAPI } from '@/lib/api';

interface AssessmentFormProps {
  assessment?: Assessment;
  playerId?: number;
  /** An explicit Save Draft or Finalize. The caller may close the form on this. */
  onSave: (assessment: Assessment) => void;
  /**
   * A background draft save. The coach is still scoring, so the caller must
   * refresh its list and leave the form open.
   */
  onDraftSaved?: (assessment: Assessment) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit' | 'view';
}

/**
 * How long the coach has to stop touching the form before the draft is written
 * back. Long enough not to fire between two ratings, short enough that a closed
 * laptop loses only a few seconds of scoring.
 */
const AUTO_SAVE_IDLE_MS = 10000;

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
  onDraftSaved,
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
  /** Title of the group's assessment, shown so the coach knows what they are scoring. */
  const [templateTitle, setTemplateTitle] = useState<string | null>(null);
  /** Set when the player's group has no assessment assigned, which blocks scoring. */
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [previousScores, setPreviousScores] = useState<{ [skillId: number]: number | null }>({});

  /**
   * The row this form writes to. Set as soon as the first save lands, so every
   * later save updates that row rather than creating a second assessment for
   * the same player.
   */
  const [draftId, setDraftId] = useState<number | null>(assessment?.id ?? null);
  /**
   * The same id, readable synchronously. A save that starts before React has
   * re-rendered would otherwise still see null and create a second row.
   */
  const draftIdRef = useRef<number | null>(assessment?.id ?? null);
  const [autoSaving, setAutoSaving] = useState(false);
  /** Bumped to re-arm the idle timer when an attempt had to stand down. */
  const [autoSaveNonce, setAutoSaveNonce] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  /** Background-save failures live in the footer; they never clear or close the form. */
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  /** Admins and managers may correct an assessment after the coach finalized it. */
  const [canEditFinalized, setCanEditFinalized] = useState(false);

  /** Stops a manual save and a background save from overlapping. */
  const savingRef = useRef(false);
  /** Resolves when the save in flight, if any, has finished. */
  const inFlightRef = useRef<Promise<void>>(Promise.resolve());
  /** Bumped on every edit, so a save can tell whether the coach typed while it ran. */
  const editVersionRef = useRef(0);
  const autoSaveRef = useRef<() => Promise<void>>(async () => {});

  const isFinalized = !!assessment?.isFinalized;
  const isReadOnly = mode === 'view' || (isFinalized && mode !== 'create' && !canEditFinalized);
  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';
  /**
   * Background saves are for drafts only. A finalized assessment a manager is
   * correcting is written back only when they press Save Changes, so nobody
   * rewrites a published record by leaving a tab open.
   */
  const autoSaveEnabled = !isReadOnly && !isFinalized && !templateError;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get current user and the players they are allowed to assess
        const currentUser = await usersAPI.getCurrentUser();
        const roles = currentUser.roles || [];
        const managesAcademy = roles.includes('ADMIN') || roles.includes('MANAGER');
        setCanEditFinalized(managesAcademy);

        // A coach only ever scores their own groups. An admin or manager opens
        // this form to correct somebody else's assessment, so they need the
        // whole academy, not the groups they happen to coach.
        let allPlayers: Player[] = [];
        if (managesAcademy) {
          allPlayers = await playersAPI.getAllList();
        } else {
          const coachGroups = await groupsAPI.getCoachGroups(currentUser.id);
          for (const group of coachGroups) {
            const groupPlayers = await playersAPI.getByGroup(group.id);
            allPlayers.push(...groupPlayers);
          }
        }

        setPlayers(allPlayers);

        // For existing assessments, load the skills and scores. Keyed off the
        // assessment's own player id, so it still loads for a player who is
        // not in the viewer's selectable list.
        if (assessment) {
          const template = await assessmentTemplatesAPI.getForPlayer(assessment.playerId);
          const skillsData = template.skills as any[];
          setSkills(skillsData as any);
          setTemplateTitle(template.title);

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
          skillsData.forEach((skill: any) => {
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

        // Skills come from the template assigned to the player's group, so two
        // players in different groups can be scored on different things.
        if (player) {
          try {
            setTemplateError(null);
            const template = await assessmentTemplatesAPI.getForPlayer(player.id);
            const skillsForLevel = template.skills as any[];
            setTemplateTitle(template.title);
            setSkills(skillsForLevel as any);

            // Initialize skill scores for new assessments or when player changes
            if (isCreating || !assessment) {
              // Fetch the latest assessment to pre-fill scores
              try {
                const latestAssessment = await assessmentsAPI.getLatestByPlayer(player.id);
                const initialScores: { [skillId: number]: SkillScoreFormData } = {};
                const prevScores: { [skillId: number]: number | null } = {};

                if (latestAssessment) {
                  // Pre-fill from latest assessment scores
                  const latestScoreMap: { [skillId: number]: number } = {};
                  latestAssessment.skillScores.forEach(ss => {
                    latestScoreMap[ss.skillId] = ss.score;
                  });

                  skillsForLevel.forEach(skill => {
                    const prevScore = latestScoreMap[skill.id] ?? null;
                    initialScores[skill.id] = {
                      skillId: skill.id,
                      score: prevScore ?? 1,
                      notes: '',
                      previousScore: prevScore,
                    };
                    prevScores[skill.id] = prevScore;
                  });
                } else {
                  // First assessment — default all scores to 1, no previous scores
                  skillsForLevel.forEach(skill => {
                    initialScores[skill.id] = {
                      skillId: skill.id,
                      score: 1,
                      notes: '',
                    };
                    prevScores[skill.id] = null;
                  });
                }

                setFormData(prev => ({ ...prev, skillScores: initialScores }));
                setPreviousScores(prevScores);
                // Pre-filled scores are not the coach's work yet. Without this
                // the background save would fire ten seconds after they picked
                // a player, writing a draft of last month's numbers.
                setHasChanges(false);
              } catch (err) {
                // Fallback: default all scores to 1 if fetching latest fails
                const initialScores: { [skillId: number]: SkillScoreFormData } = {};
                skillsForLevel.forEach(skill => {
                  initialScores[skill.id] = {
                    skillId: skill.id,
                    score: 1,
                    notes: '',
                  };
                });
                setFormData(prev => ({ ...prev, skillScores: initialScores }));
                setPreviousScores({});
                setHasChanges(false);
              }
            }
          } catch (err) {
            // The usual cause is a group with no assessment assigned, and the
            // backend explains exactly that, so surface its message verbatim.
            const message = err instanceof Error
              ? err.message
              : 'Failed to load the assessment for this player';
            console.error('Failed to load assessment template:', err);
            setSkills([]);
            setTemplateTitle(null);
            setTemplateError(message);
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
    editVersionRef.current += 1;
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
    editVersionRef.current += 1;
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

  /**
   * Writes the form to the server. The first write creates the assessment and
   * every later one updates that same row, so a form left open for a whole
   * session produces one assessment rather than one per save.
   */
  const persist = async (finalize: boolean): Promise<Assessment> => {
    const skillRatingsArray = Object.values(formData.skillScores)
      .filter(score => score.score > 0 || score.notes?.trim())
      .map(score => ({
        skillId: score.skillId,
        score: score.score,
        notes: score.notes?.trim() || undefined
      }));

    if (draftIdRef.current) {
      const updateData: AssessmentUpdateRequest = {
        assessmentDate: formData.assessmentDate,
        period: formData.period,
        // Sent even when empty: the update endpoint reads a missing field as
        // "leave it alone", so omitting these would make a cleared comment box
        // silently keep its old text.
        comments: formData.comments?.trim() ?? '',
        coachNotes: formData.coachNotes?.trim() ?? '',
        skillRatings: skillRatingsArray,
        isFinalized: finalize
      };
      return assessmentsAPI.update(draftIdRef.current, updateData);
    }

    const createData: AssessmentCreateRequest = {
      playerId: formData.playerId!,
      assessmentDate: formData.assessmentDate,
      period: formData.period,
      comments: formData.comments?.trim() || undefined,
      coachNotes: formData.coachNotes?.trim() || undefined,
      skillRatings: skillRatingsArray,
      isFinalized: finalize
    };
    const created = await assessmentsAPI.create(createData);
    draftIdRef.current = created.id;
    setDraftId(created.id);
    return created;
  };

  const handleSave = async (finalize: boolean = false) => {
    if (isReadOnly) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0 && (finalize || !isDraft)) {
      setError(validationErrors.join(', '));
      return;
    }

    // A background draft save may have started a second ago. Let it land, so
    // this write updates that row instead of racing it into a second one.
    await inFlightRef.current;
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      const result = await persist(finalize);

      setHasChanges(false);
      setAutoSaveError(null);
      setLastSavedAt(new Date());
      setIsDraft(!finalize);
      onSave(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  /**
   * The background draft save. It deliberately does not call onSave: the coach
   * is still scoring, and having the form close under them was the complaint
   * this replaces.
   */
  const autoSaveDraft = async () => {
    if (!autoSaveEnabled || !hasChanges || !formData.playerId) return;
    if (isAssessmentEmpty()) return;

    if (savingRef.current) {
      // A save is already in flight. Come back once it lands, rather than
      // dropping the edits made since it started.
      setAutoSaveNonce(n => n + 1);
      return;
    }

    const versionAtSave = editVersionRef.current;
    savingRef.current = true;
    setAutoSaving(true);

    try {
      const result = await persist(false);

      setLastSavedAt(new Date());
      setAutoSaveError(null);
      // Only call it clean if the coach did not type while the save was in flight.
      if (editVersionRef.current === versionAtSave) {
        setHasChanges(false);
      }
      onDraftSaved?.(result);
    } catch (err) {
      // Say so quietly in the footer and leave every score on screen. The next
      // edit schedules another attempt, and Save Draft is still there.
      setAutoSaveError(err instanceof Error ? err.message : 'Could not save the draft');
    } finally {
      savingRef.current = false;
      setAutoSaving(false);
    }
  };

  autoSaveRef.current = autoSaveDraft;

  // Save the draft once the coach has paused. Every edit resets the timer, so
  // it lands between two ratings instead of interrupting one.
  useEffect(() => {
    if (!autoSaveEnabled || !hasChanges) return;

    const timer = setTimeout(() => {
      // autoSaveDraft handles its own errors, so this promise only ever
      // resolves; a manual save awaits it before writing.
      inFlightRef.current = autoSaveRef.current?.() ?? Promise.resolve();
    }, AUTO_SAVE_IDLE_MS);

    return () => clearTimeout(timer);
  }, [formData, hasChanges, autoSaveEnabled, autoSaveNonce]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent-teal/5 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                {isCreating ? 'New Assessment' : isEditing ? 'Edit Assessment' : 'View Assessment'}
              </h2>
              {selectedPlayer ? (
                <p className="text-text-secondary text-lg">
                  {selectedPlayer.fullName} • {selectedPlayer.level} Level
                </p>
              ) : assessment ? (
                <p className="text-text-secondary text-lg">{assessment.playerName}</p>
              ) : null}
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
                disabled={isReadOnly || isEditing || draftId !== null}
                className="select-base disabled:opacity-50"
              >
                <option value="">Select a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id} className="bg-white text-text-primary">
                    {player.fullName} ({player.level})
                  </option>
                ))}
              </select>
              {isCreating && draftId !== null && (
                <p className="mt-2 text-xs text-text-secondary">
                  A draft is saved for this player. To score someone else, cancel
                  and start a new assessment.
                </p>
              )}
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
                className="select-base disabled:opacity-50"
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
                className="select-base disabled:opacity-50"
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
            <div>
              <h3 className="text-xl font-semibold text-text-primary">Skill Ratings</h3>
              {templateTitle && (
                <p className="text-sm text-text-secondary">
                  From &ldquo;{templateTitle}&rdquo;, the assessment assigned to this player&apos;s group
                </p>
              )}
            </div>
          </div>

          {!formData.playerId ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">Select a player to load skills</p>
              <p className="text-text-secondary">Skills come from the assessment assigned to their group</p>
            </div>
          ) : templateError ? (
            <div className="text-center py-12 px-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-text-primary text-lg font-medium mb-2">
                This player cannot be assessed yet
              </p>
              <p className="text-accent-yellow">{templateError}</p>
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
                          previousScore={previousScores[skill.id] ?? null}
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              {/* Save state, in the coach's words. The form stays open through
                  every background save, so this line is the only thing that
                  moves when one lands. */}
              <div className="flex flex-col gap-1 min-w-0 lg:flex-1">
                {!autoSaveEnabled ? (
                  <span className="text-sm text-text-secondary">
                    {saving
                      ? 'Saving...'
                      : 'This assessment is finalized — your changes are saved when you press Save Changes'}
                  </span>
                ) : saving || autoSaving ? (
                  <span className="text-sm text-text-secondary">Saving draft...</span>
                ) : hasChanges ? (
                  <div className="flex items-center gap-2 text-accent-yellow">
                    <div className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                ) : lastSavedAt ? (
                  <span className="text-sm text-accent-teal">
                    Draft saved at{' '}
                    {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-sm text-text-secondary">
                    Your draft saves itself in the background — this page stays open
                  </span>
                )}

                {autoSaveError && (
                  <span className="text-sm text-accent-red">
                    Background save failed: {autoSaveError}
                  </span>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 shrink-0">
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-6 py-3 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors font-medium"
                >
                  Cancel
                </button>

                {isFinalized ? (
                  /* Correcting a finalized assessment: one save, and it stays
                     finalized. There is nothing left to finalize. */
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving || isAssessmentEmpty()}
                    className="btn-primary btn-lg flex items-center justify-center gap-2 whitespace-nowrap rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleSave(false)}
                      disabled={saving || isAssessmentEmpty()}
                      className="flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3 bg-gray-100 text-text-primary rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <Save size={18} />
                      Save &amp; Close
                    </button>

                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving || isAssessmentEmpty()}
                      className="flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 font-medium"
                    >
                      <Send size={18} />
                      {saving ? 'Finalizing...' : 'Finalize Assessment'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};