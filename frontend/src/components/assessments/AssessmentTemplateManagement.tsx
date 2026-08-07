"use client";

import { useState, useEffect, useCallback } from 'react';
import { AssessmentTemplate } from '@/types/assessmentTemplates';
import { SkillCategory } from '@/types/skills';
import { assessmentTemplatesAPI } from '@/lib/api';
import AssessmentTemplateForm from './AssessmentTemplateForm';

interface AssessmentTemplateManagementProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  /** Groups with no template, so the consequence is visible from here too. */
  groupsWithoutTemplate?: string[];
  /** Re-read groups after a change, since assignments are shown on each card. */
  onTemplatesChanged?: () => void;
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  [SkillCategory.ATHLETIC]: 'Athletic',
  [SkillCategory.TECHNICAL]: 'Technical',
  [SkillCategory.MENTALITY]: 'Mentality',
  [SkillCategory.PERSONALITY]: 'Personality',
};

export default function AssessmentTemplateManagement({
  onError,
  onSuccess,
  groupsWithoutTemplate = [],
  onTemplatesChanged,
}: AssessmentTemplateManagementProps) {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState<{ isOpen: boolean; template: AssessmentTemplate | null }>({
    isOpen: false,
    template: null,
  });

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      setTemplates(await assessmentTemplatesAPI.getAll(false));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (template: AssessmentTemplate) => {
    if (!confirm(`Delete "${template.title}"? This cannot be undone.`)) return;
    try {
      await assessmentTemplatesAPI.delete(template.id);
      onSuccess(`"${template.title}" deleted`);
      await loadTemplates();
      onTemplatesChanged?.();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete the assessment');
    }
  };

  const countByCategory = (template: AssessmentTemplate) => {
    const counts = new Map<SkillCategory, number>();
    for (const skill of template.skills) {
      counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
    }
    return counts;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Assessments</h2>
          <p className="text-xs text-text-secondary mt-1">
            Each assessment is a set of skills from the library. Assign one to a group and its
            players are assessed on exactly those skills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ isOpen: true, template: null })}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-text-primary text-sm sm:text-base font-medium transition-all duration-200"
        >
          New Assessment
        </button>
      </div>

      {groupsWithoutTemplate.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-accent-yellow">
            <span className="font-medium">
              {groupsWithoutTemplate.length} group{groupsWithoutTemplate.length > 1 ? 's have' : ' has'} no
              assessment assigned
            </span>{' '}
            — {groupsWithoutTemplate.join(', ')}. Their players cannot be assessed until one is
            assigned from the Groups tab.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No assessments yet.</p>
          <p className="text-xs text-text-secondary mt-1">
            Create one to define what a group&apos;s players are scored on.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => {
            const counts = countByCategory(template);
            return (
              <div
                key={template.id}
                className={`rounded-xl border p-5 transition-colors ${
                  template.isActive ? 'border-border bg-background' : 'border-border bg-background opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-text-primary">{template.title}</h3>
                  {!template.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-text-secondary border border-border">
                      Inactive
                    </span>
                  )}
                </div>

                {template.description && (
                  <p className="text-xs text-text-secondary mb-3">{template.description}</p>
                )}

                <p className="text-sm text-text-primary mb-2">
                  {template.skillCount} skill{template.skillCount === 1 ? '' : 's'}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.from(counts.entries()).map(([category, count]) => (
                    <span
                      key={category}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {CATEGORY_LABELS[category]} {count}
                    </span>
                  ))}
                </div>

                <div className="border-t border-border pt-3 mb-3">
                  {template.assignedGroupCount > 0 ? (
                    <p className="text-xs text-text-secondary">
                      <span className="text-text-primary">Used by:</span>{' '}
                      {template.assignedGroupNames.join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary">
                      Not assigned to any group yet
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormState({ isOpen: true, template })}
                    className="flex-1 px-3 py-1.5 text-sm bg-secondary-100 hover:bg-secondary-50 border border-border rounded-lg text-text-primary transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template)}
                    disabled={template.assignedGroupCount > 0}
                    title={
                      template.assignedGroupCount > 0
                        ? 'Assigned to a group. Reassign those groups first.'
                        : 'Delete this assessment'
                    }
                    className="px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-accent-red transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssessmentTemplateForm
        isOpen={formState.isOpen}
        template={formState.template}
        onClose={() => setFormState({ isOpen: false, template: null })}
        onComplete={saved => {
          onSuccess(
            formState.template ? `"${saved.title}" updated` : `"${saved.title}" created`
          );
          loadTemplates();
          onTemplatesChanged?.();
        }}
      />
    </div>
  );
}
