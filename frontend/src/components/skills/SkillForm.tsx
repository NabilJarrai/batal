'use client';

import { useState, useEffect } from 'react';
import { 
  Skill, 
  SkillFormData, 
  SkillCategory, 
  SkillLevel, 
  SKILL_CATEGORIES, 
  SKILL_LEVELS,
  getCategoryColor,
  getLevelColor 
} from '@/types/skills';

interface SkillFormProps {
  skill?: Skill;
  onSubmit: (data: SkillFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SkillForm({ skill, onSubmit, onCancel, isLoading = false }: SkillFormProps) {
  const [formData, setFormData] = useState<SkillFormData>({
    name: skill?.name || '',
    category: skill?.category || SkillCategory.ATHLETIC,
    applicableLevel: skill?.applicableLevel || SkillLevel.DEVELOPMENT,
    description: skill?.description || '',
    isActive: skill?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<SkillFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name,
        category: skill.category,
        applicableLevel: skill.applicableLevel,
        description: skill.description || '',
        isActive: skill.isActive,
      });
    }
  }, [skill]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SkillFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Skill name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Skill name must not exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SkillFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isEditMode = !!skill;

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {isEditMode ? 'Edit Skill' : 'Create New Skill'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Skill Name */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Skill Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              errors.name ? 'border-red-500' : 'border-white/20'
            }`}
            placeholder="Enter skill name"
            disabled={isSubmitting}
            maxLength={100}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Category *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SKILL_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => handleChange('category', category.key)}
                disabled={isSubmitting || (isEditMode && skill?.usageCount > 0)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  formData.category === category.key
                    ? `${category.color} border-white/30 text-white`
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                } ${
                  (isSubmitting || (isEditMode && skill?.usageCount > 0)) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-white/40'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <div className="text-left">
                  <p className="font-medium">{category.label}</p>
                </div>
              </button>
            ))}
          </div>
          {isEditMode && skill?.usageCount > 0 && (
            <p className="text-yellow-400 text-sm mt-1">
              ℹ️ Category cannot be changed as this skill is used in {skill.usageCount} assessment(s)
            </p>
          )}
        </div>

        {/* Level Selection */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Applicable Level *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.key}
                type="button"
                onClick={() => handleChange('applicableLevel', level.key)}
                disabled={isSubmitting || (isEditMode && skill?.usageCount > 0)}
                className={`flex items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
                  formData.applicableLevel === level.key
                    ? `${level.color} border-white/30 text-white`
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                } ${
                  (isSubmitting || (isEditMode && skill?.usageCount > 0))
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-white/40'
                }`}
              >
                <p className="font-medium">{level.label}</p>
              </button>
            ))}
          </div>
          {isEditMode && skill?.usageCount > 0 && (
            <p className="text-yellow-400 text-sm mt-1">
              ℹ️ Level cannot be changed as this skill is used in assessments
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 bg-white/10 backdrop-blur-sm border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none ${
              errors.description ? 'border-red-500' : 'border-white/20'
            }`}
            placeholder="Enter skill description (optional)"
            disabled={isSubmitting}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description ? (
              <p className="text-red-400 text-sm">{errors.description}</p>
            ) : (
              <div></div>
            )}
            <p className="text-gray-400 text-sm">
              {formData.description.length}/500
            </p>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 text-cyan-600 bg-white/10 border-white/20 rounded focus:ring-cyan-500 focus:ring-2"
          />
          <label htmlFor="isActive" className="text-sm text-blue-200">
            Active (skill is available for assessments)
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isSubmitting || isLoading) && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEditMode ? 'Update Skill' : 'Create Skill'}
          </button>
        </div>
      </form>
    </div>
  );
}