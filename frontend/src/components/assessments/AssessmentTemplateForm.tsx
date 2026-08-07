"use client";

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AssessmentTemplate, AssessmentTemplateRequest } from '@/types/assessmentTemplates';
import { Skill, SkillCategory, SkillLevel } from '@/types/skills';
import { assessmentTemplatesAPI } from '@/lib/api';
import { skillsAPI } from '@/lib/api/skills';

interface AssessmentTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (template: AssessmentTemplate) => void;
  /** Null creates a new template; otherwise the one being edited. */
  template?: AssessmentTemplate | null;
}

const CATEGORY_ORDER: SkillCategory[] = [
  SkillCategory.ATHLETIC,
  SkillCategory.TECHNICAL,
  SkillCategory.MENTALITY,
  SkillCategory.PERSONALITY,
];

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  [SkillCategory.ATHLETIC]: 'Athletic',
  [SkillCategory.TECHNICAL]: 'Technical',
  [SkillCategory.MENTALITY]: 'Mentality',
  [SkillCategory.PERSONALITY]: 'Personality',
};

export default function AssessmentTemplateForm({
  isOpen,
  onClose,
  onComplete,
  template = null,
}: AssessmentTemplateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [levelFilter, setLevelFilter] = useState<SkillLevel | 'ALL'>('ALL');

  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = template !== null;

  useEffect(() => {
    if (!isOpen) return;

    setTitle(template?.title ?? '');
    setDescription(template?.description ?? '');
    setSelectedSkillIds(template?.skills.map(s => s.id) ?? []);
    setLevelFilter('ALL');
    setError(null);

    let cancelled = false;
    setIsLoadingSkills(true);
    skillsAPI
      .getAllList()
      .then(skills => {
        if (cancelled) return;
        // Inactive skills cannot be assessed, so they are not offered. One
        // already on an edited template still shows, to explain the count.
        const chosen = new Set(template?.skills.map(s => s.id) ?? []);
        setAllSkills(skills.filter(s => s.isActive || chosen.has(s.id)));
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load the skills library');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSkills(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, template]);

  // Level is only a filter here. A template's skills are whatever the admin
  // picks; the group decides who it applies to.
  const visibleSkills = useMemo(() => {
    if (levelFilter === 'ALL') return allSkills;
    return allSkills.filter(s => s.applicableLevels.includes(levelFilter));
  }, [allSkills, levelFilter]);

  const skillsByCategory = useMemo(() => {
    const grouped = new Map<SkillCategory, Skill[]>();
    for (const category of CATEGORY_ORDER) {
      const inCategory = visibleSkills
        .filter(s => s.category === category)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
      if (inCategory.length > 0) grouped.set(category, inCategory);
    }
    return grouped;
  }, [visibleSkills]);

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const toggleCategory = (category: SkillCategory) => {
    const ids = (skillsByCategory.get(category) ?? []).map(s => s.id);
    const allChosen = ids.every(id => selectedSkillIds.includes(id));
    setSelectedSkillIds(prev =>
      allChosen ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Give the assessment a title.');
      return;
    }
    if (selectedSkillIds.length === 0) {
      setError('Pick at least one skill. A template with none would block every assessment for its groups.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: AssessmentTemplateRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      skillIds: selectedSkillIds,
      isActive: template?.isActive ?? true,
    };

    try {
      const saved = isEditing
        ? await assessmentTemplatesAPI.update(template!.id, payload)
        : await assessmentTemplatesAPI.create(payload);
      onComplete(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-background-modal border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-text-primary mb-1">
                  {isEditing ? `Edit "${template!.title}"` : 'New Assessment'}
                </Dialog.Title>
                <p className="text-xs text-text-secondary mb-4">
                  Pick the skills this assessment covers. Assign it to a group to decide which
                  players it applies to.
                </p>

                {isEditing && template!.assignedGroupCount > 0 && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-accent-yellow">
                      In use by {template!.assignedGroupCount} group
                      {template!.assignedGroupCount > 1 ? 's' : ''}:{' '}
                      {template!.assignedGroupNames.join(', ')}. Changes apply to future
                      assessments; those already recorded keep the skills they were scored on.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-accent-red">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Monthly Development Assessment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className={inputClass}
                      placeholder="Optional note about when this assessment is used"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                        Skills ({selectedSkillIds.length} selected)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">Filter by level:</span>
                        {(['ALL', SkillLevel.DEVELOPMENT, SkillLevel.ADVANCED] as const).map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setLevelFilter(value)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              levelFilter === value
                                ? 'bg-primary text-white'
                                : 'bg-secondary-100 text-text-secondary border border-border hover:bg-secondary-50'
                            }`}
                          >
                            {value === 'ALL' ? 'All' : value === SkillLevel.DEVELOPMENT ? 'Development' : 'Advanced'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isLoadingSkills ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                        <span className="ml-2 text-sm text-text-secondary">Loading skills...</span>
                      </div>
                    ) : skillsByCategory.size === 0 ? (
                      <p className="text-sm text-text-secondary text-center py-8">
                        No skills match this filter.
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                        {CATEGORY_ORDER.filter(c => skillsByCategory.has(c)).map(category => {
                          const skills = skillsByCategory.get(category)!;
                          const allChosen = skills.every(s => selectedSkillIds.includes(s.id));
                          return (
                            <div key={category} className="rounded-lg border border-border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-text-primary">
                                  {CATEGORY_LABELS[category]}
                                  <span className="text-text-secondary ml-2 text-xs">
                                    {skills.filter(s => selectedSkillIds.includes(s.id)).length}/{skills.length}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(category)}
                                  className="text-xs text-primary hover:text-primary-hover transition-colors"
                                >
                                  {allChosen ? 'Clear all' : 'Select all'}
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {skills.map(skill => (
                                  <label
                                    key={skill.id}
                                    className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-secondary cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedSkillIds.includes(skill.id)}
                                      onChange={() => toggleSkill(skill.id)}
                                      className="mt-0.5 h-4 w-4 rounded text-blue-600"
                                    />
                                    <span className="min-w-0">
                                      <span className="block text-sm text-text-primary truncate">
                                        {skill.name}
                                      </span>
                                      <span className="block text-xs text-text-secondary">
                                        {skill.applicableLevels
                                          .map(l => (l === SkillLevel.DEVELOPMENT ? 'Dev' : 'Adv'))
                                          .join(' · ')}
                                        {!skill.isActive && ' · inactive'}
                                      </span>
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary font-medium transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Assessment'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
