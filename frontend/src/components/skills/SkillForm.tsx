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
    applicableLevels: skill?.applicableLevels || [SkillLevel.DEVELOPMENT],
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
        applicableLevels: skill.applicableLevels || [SkillLevel.DEVELOPMENT],
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

    if (!formData.applicableLevels || formData.applicableLevels.length === 0) {
      (newErrors as any).applicableLevels = 'At least one applicable level must be selected';
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
    <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-2xl mx-auto overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-cyan-500/10 rounded-full blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {isEditMode ? 'Edit Skill' : 'Create New Skill'}
              </h3>
              <p className="text-gray-300 text-sm">
                {isEditMode ? 'Update skill details and settings' : 'Add a new skill to the system'}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="
              p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white
              transition-all duration-300 hover:scale-105 backdrop-blur-sm
              border border-white/20 hover:border-white/30
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Skill Name */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <div className="p-1 bg-primary/20 rounded-lg">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              Skill Name *
            </label>
            <div className="relative group">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`
                  w-full px-4 py-3 pr-16 rounded-xl transition-all duration-300
                  bg-white/5 border backdrop-blur-sm text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:scale-[1.02]
                  ${errors.name
                    ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/30 bg-red-500/5'
                    : 'border-white/20 focus:border-primary focus:ring-primary/30 hover:border-white/30'
                  }
                  group-hover:shadow-lg
                `}
                placeholder="Enter skill name (e.g., Ball Control, Speed, Leadership)"
                disabled={isSubmitting}
                maxLength={100}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm transition-colors duration-300 group-focus-within:text-primary">
                {formData.name.length}/100
              </div>
            </div>
            {errors.name && (
              <div className="mt-3 flex items-center gap-2 text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errors.name}</span>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <div className="p-1 bg-purple-500/20 rounded-lg">
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              Category *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {SKILL_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => handleChange('category', category.key)}
                  disabled={isSubmitting || (isEditMode && skill?.usageCount > 0)}
                  className={`
                    group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                    backdrop-blur-sm border overflow-hidden
                    ${formData.category === category.key
                      ? `${category.color} border-white/30 text-white shadow-2xl scale-105 ring-2 ring-white/20`
                      : `${category.bgColor} ${category.borderColor} ${category.textColor} hover:scale-105 hover:shadow-xl`
                    }
                    ${(isSubmitting || (isEditMode && skill?.usageCount > 0))
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-white/40 cursor-pointer'
                    }
                    before:absolute before:inset-0 before:bg-white/5 before:opacity-0
                    before:transition-opacity before:duration-300 hover:before:opacity-100
                  `}
                >
                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className={`text-3xl transition-all duration-300 ${
                      formData.category === category.key ? 'scale-110 rotate-12' : 'group-hover:scale-105'
                    }`}>
                      {(category as any).emoji || category.icon}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-base mb-1">{category.label}</p>
                      <p className="text-xs opacity-90">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  {formData.category === category.key && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {isEditMode && skill?.usageCount > 0 && (
              <div className="mt-4 flex items-center gap-3 text-yellow-300 text-sm bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 backdrop-blur-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Category cannot be changed as this skill is used in {skill.usageCount} assessment(s)</span>
              </div>
            )}
          </div>

          {/* Level Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <div className="p-1 bg-green-500/20 rounded-lg">
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Applicable Levels *
            </label>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
              <p className="text-gray-300 text-sm mb-6 text-center font-medium">
                Select which levels this skill applies to
              </p>
              <div className="flex gap-4 justify-center">
                {SKILL_LEVELS.map((level) => {
                  const isSelected = formData.applicableLevels.includes(level.key);
                  const isLastSelected = formData.applicableLevels.length === 1 && isSelected;

                  return (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() => {
                        const currentLevels = [...formData.applicableLevels];
                        if (isSelected) {
                          // Remove level if already selected (but keep at least one)
                          if (currentLevels.length > 1) {
                            const newLevels = currentLevels.filter(l => l !== level.key);
                            handleChange('applicableLevels', newLevels);
                          }
                        } else {
                          // Add level if not selected
                          currentLevels.push(level.key);
                          handleChange('applicableLevels', currentLevels);
                        }
                      }}
                      disabled={isSubmitting || (isEditMode && skill?.usageCount > 0)}
                      className={`
                        relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-300
                        transform hover:scale-110 min-w-[140px] group backdrop-blur-sm shadow-lg
                        ${isSelected
                          ? `${level.color} border-white/40 text-white shadow-2xl scale-105 ring-2 ring-white/30`
                          : `${level.bgColor} ${level.borderColor} ${level.textColor} hover:shadow-xl hover:border-white/30`
                        }
                        ${(isSubmitting || (isEditMode && skill?.usageCount > 0))
                          ? 'opacity-50 cursor-not-allowed transform-none'
                          : 'cursor-pointer'
                        }
                        ${isLastSelected
                          ? 'ring-2 ring-yellow-400/50'
                          : ''
                        }
                        before:absolute before:inset-0 before:bg-white/5 before:opacity-0 before:rounded-xl
                        before:transition-opacity before:duration-300 hover:before:opacity-100
                      `}
                    >
                      {/* Selection indicator */}
                      <div className={`
                        absolute -top-2 -right-2 w-7 h-7 rounded-full border-2 border-white/30
                        transition-all duration-300 backdrop-blur-sm shadow-lg
                        ${isSelected
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 scale-100'
                          : 'bg-white/10 scale-0 group-hover:scale-100'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-5 h-5 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Level icon and text */}
                      <div className={`text-3xl mb-3 transition-all duration-300 ${
                        isSelected ? 'scale-110 rotate-12' : 'group-hover:scale-105'
                      }`}>
                        {level.icon}
                      </div>
                      <p className={`font-bold text-base mb-1 transition-all duration-300 ${
                        isSelected ? 'text-white' : 'text-current'
                      }`}>
                        {level.label}
                      </p>
                      <p className={`text-xs opacity-80 text-center transition-all duration-300 ${
                        isSelected ? 'text-white/90' : 'text-current'
                      }`}>
                        {level.description}
                      </p>

                      {/* Cannot remove indicator */}
                      {isLastSelected && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-yellow-400/30 border border-yellow-400/50 rounded-lg px-3 py-1 backdrop-blur-sm shadow-lg">
                            <span className="text-yellow-200 text-xs font-bold">Required</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Both levels selected indicator */}
              {formData.applicableLevels.length === 2 && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/25 to-cyan-500/25 border border-green-400/40 rounded-xl px-6 py-3 backdrop-blur-sm shadow-lg">
                    <span className="text-cyan-300 text-xl animate-pulse">✨</span>
                    <span className="text-cyan-200 text-sm font-bold">Available for all levels</span>
                    <span className="text-cyan-300 text-xl animate-pulse">✨</span>
                  </div>
                </div>
              )}
            </div>

            {(errors as any).applicableLevels && (
              <div className="mt-4 flex items-center gap-3 text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{(errors as any).applicableLevels}</span>
              </div>
            )}

            {isEditMode && skill?.usageCount > 0 && (
              <div className="mt-4 flex items-center gap-3 text-yellow-300 text-sm bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 backdrop-blur-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Levels cannot be changed as this skill is used in {skill.usageCount} assessment(s)</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <div className="p-1 bg-amber-500/20 rounded-lg">
                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Description (Optional)
            </label>
            <div className="relative group">
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className={`
                  w-full px-4 py-3 pr-16 rounded-xl transition-all duration-300 resize-none
                  bg-white/5 border backdrop-blur-sm text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:scale-[1.02]
                  ${errors.description
                    ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/30 bg-red-500/5'
                    : 'border-white/20 focus:border-amber-400 focus:ring-amber-400/30 hover:border-white/30'
                  }
                  group-hover:shadow-lg
                `}
                placeholder="Enter a brief description of this skill (e.g., Player's ability to control the ball with various body parts...)"
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-gray-400 text-xs transition-colors duration-300 group-focus-within:text-amber-300">
                {formData.description.length}/500
              </div>
            </div>
            {errors.description && (
              <div className="mt-3 flex items-center gap-2 text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errors.description}</span>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`
                  p-2 rounded-xl transition-all duration-300
                  ${formData.isActive
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                    : 'bg-gradient-to-br from-gray-500/20 to-gray-600/20'
                  }
                `}>
                  <svg className={`w-6 h-6 transition-colors duration-300 ${
                    formData.isActive ? 'text-green-300' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={formData.isActive
                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                </div>
                <div>
                  <label htmlFor="isActive" className="text-base font-bold text-white cursor-pointer mb-1 block">
                    Skill Status
                  </label>
                  <p className={`text-sm transition-colors duration-300 ${
                    formData.isActive ? 'text-green-200' : 'text-gray-400'
                  }`}>
                    {formData.isActive ? 'Active and available for assessments' : 'Inactive and hidden from assessments'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleChange('isActive', !formData.isActive)}
                disabled={isSubmitting}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full border-2 transition-all duration-300
                  focus:outline-none focus:ring-2 shadow-lg backdrop-blur-sm
                  ${formData.isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/50 focus:ring-green-400/50'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500/50 focus:ring-gray-400/50'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white shadow-xl transition-all duration-300
                    flex items-center justify-center
                    ${formData.isActive ? 'translate-x-7' : 'translate-x-1'}
                  `}
                >
                  <svg className={`w-3 h-3 transition-colors duration-300 ${
                    formData.isActive ? 'text-green-500' : 'text-gray-500'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d={formData.isActive
                        ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        : "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-white/20">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="
                px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 hover:text-white
                hover:scale-105 backdrop-blur-sm shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="
                px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3
                bg-gradient-to-r from-primary to-secondary text-white border border-primary/30
                hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                backdrop-blur-sm
              "
            >
              {(isSubmitting || isLoading) && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={isEditMode
                    ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    : "M12 6v6m0 0v6m0-6h6m-6 0H6"
                  }
                />
              </svg>
              {isEditMode ? 'Update Skill' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}