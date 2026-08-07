"use client";

import { useEffect, useState } from 'react';
import { AssessmentTemplate } from '@/types/assessmentTemplates';
import { assessmentTemplatesAPI } from '@/lib/api';

interface AssessmentTemplateSelectProps {
  value?: number;
  onChange: (templateId: number | undefined) => void;
}

/**
 * Picks the assessment a group's players are scored on.
 *
 * Only active templates are offered, since an inactive one cannot be assigned.
 * Leaving it unset is allowed but blocks assessments for the group, so that is
 * spelled out rather than left to be discovered by a coach.
 */
export default function AssessmentTemplateSelect({ value, onChange }: AssessmentTemplateSelectProps) {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    assessmentTemplatesAPI
      .getAll(true)
      .then(result => {
        if (!cancelled) setTemplates(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = templates.find(t => t.id === value);

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Assessment (Optional)
      </label>

      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        disabled={isLoading || failed}
        className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
      >
        <option value="">
          {isLoading ? 'Loading assessments...' : 'No assessment assigned'}
        </option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.title} ({template.skillCount} skill{template.skillCount === 1 ? '' : 's'})
          </option>
        ))}
      </select>

      {failed && (
        <p className="text-xs text-accent-red mt-2">Failed to load assessments.</p>
      )}

      {!isLoading && !failed && templates.length === 0 && (
        <div className="mt-2 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
          <p className="text-xs text-accent-yellow">
            No assessments exist yet. Create one on the Assessments tab, then assign it here.
          </p>
        </div>
      )}

      {!isLoading && !failed && templates.length > 0 && !value && (
        <div className="mt-2 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
          <p className="text-xs text-accent-yellow">
            Without an assessment, this group&apos;s players cannot be assessed.
          </p>
        </div>
      )}

      {selected && (
        <p className="text-xs text-text-secondary mt-2">
          Players in this group will be scored on {selected.skillCount} skill
          {selected.skillCount === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}
