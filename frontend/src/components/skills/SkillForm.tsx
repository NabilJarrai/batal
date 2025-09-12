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
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              {isEditMode ? 'Edit Skill' : 'Create New Skill'}
            </h3>
            <p className="text-sm text-gray-400">
              {isEditMode ? 'Update skill details and settings' : 'Add a new skill to the system'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg p-2"
          disabled={isSubmitting}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skill Name */}
        <div className="relative">
          <label className="block text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Skill Name *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 ${
                errors.name ? 'border-red-500/50 bg-red-500/5' : 'border-white/20 hover:border-white/30'
              } ${formData.name ? 'bg-white/10' : ''}`}
              placeholder="Enter skill name"
              disabled={isSubmitting}
              maxLength={100}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              {formData.name.length}/100
            </div>
          </div>
          {errors.name && (
            <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Category *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {SKILL_CATEGORIES.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => handleChange('category', category.key)}
                disabled={isSubmitting || (isEditMode && skill?.usageCount > 0)}
                className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  formData.category === category.key
                    ? `${category.color} border-white/40 shadow-lg shadow-cyan-500/20 text-white`
                    : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                } ${
                  (isSubmitting || (isEditMode && skill?.usageCount > 0)) 
                    ? 'opacity-50 cursor-not-allowed transform-none' 
                    : ''
                }`}
              >
                <div className={`text-2xl transition-all duration-300 ${
                  formData.category === category.key ? 'scale-110' : 'group-hover:scale-105'
                }`}>
                  {category.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-base">{category.label}</p>
                  <p className="text-xs opacity-75 mt-0.5">
                    {category.key === 'ATHLETIC' && 'Physical abilities'}
                    {category.key === 'TECHNICAL' && 'Football skills'}
                    {category.key === 'MENTALITY' && 'Tactical awareness'}
                    {category.key === 'PERSONALITY' && 'Character traits'}
                  </p>
                </div>
                {formData.category === category.key && (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          {isEditMode && skill?.usageCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Category cannot be changed as this skill is used in {skill.usageCount} assessment(s)</span>
            </div>
          )}
        </div>

        {/* Level Selection */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-3">
            Applicable Levels *
          </label>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-gray-300 text-xs mb-4 text-center">
              Select which levels this skill applies to
            </p>
            <div className="flex gap-3 justify-center">
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
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 min-w-[120px] group ${
                      isSelected
                        ? `${level.color.replace('bg-', 'bg-').replace('/50', '/20')} border-white/40 shadow-lg shadow-cyan-500/20 text-white`
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-gray-200'
                    } ${
                      (isSubmitting || (isEditMode && skill?.usageCount > 0))
                        ? 'opacity-50 cursor-not-allowed transform-none' 
                        : ''
                    } ${
                      isLastSelected 
                        ? 'ring-2 ring-yellow-400/50' 
                        : ''
                    }`}
                  >
                    {/* Selection indicator */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white/20 transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-green-400 to-cyan-400 scale-100' 
                        : 'bg-white/10 scale-0 group-hover:scale-100'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Level icon and text */}
                    <div className={`text-2xl mb-2 transition-all duration-300 ${
                      isSelected ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      {level.key === SkillLevel.DEVELOPMENT ? '🌱' : '🏆'}
                    </div>
                    <p className={`font-semibold text-sm transition-all duration-300 ${
                      isSelected ? 'text-white' : 'text-current'
                    }`}>
                      {level.label}
                    </p>
                    
                    {/* Cannot remove indicator */}
                    {isLastSelected && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-full px-2 py-0.5">
                          <span className="text-yellow-300 text-xs font-medium">Required</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Both levels selected indicator */}
            {formData.applicableLevels.length === 2 && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 rounded-full px-4 py-2">
                  <span className="text-green-300 text-lg">✨</span>
                  <span className="text-green-200 text-sm font-medium">Available for all levels</span>
                </div>
              </div>
            )}
          </div>
          
          {(errors as any).applicableLevels && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {(errors as any).applicableLevels}
            </div>
          )}
          
          {isEditMode && skill?.usageCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Levels cannot be changed as this skill is used in {skill.usageCount} assessment(s)</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Description
          </label>
          <div className="relative">
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 resize-none transition-all duration-300 ${
                errors.description ? 'border-red-500/50 bg-red-500/5' : 'border-white/20 hover:border-white/30'
              } ${formData.description ? 'bg-white/10' : ''}`}
              placeholder="Enter a brief description of this skill (optional)"
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-gray-400 text-xs bg-black/20 rounded-md px-2 py-1">
              {formData.description.length}/500
            </div>
          </div>
          {errors.description && (
            <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.description}
            </div>
          )}
        </div>

        {/* Active Status */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <label htmlFor="isActive" className="text-sm font-medium text-blue-200 cursor-pointer">
                  Skill Status
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formData.isActive ? 'Active and available for assessments' : 'Inactive and hidden from assessments'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              disabled={isSubmitting}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                formData.isActive
                  ? 'bg-gradient-to-r from-green-500 to-cyan-500 border-green-400/50'
                  : 'bg-gray-600 border-gray-500'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:scale-105 disabled:transform-none"
          >
            {(isSubmitting || isLoading) && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
            {isEditMode ? 'Update Skill' : 'Create Skill'}
          </button>
        </div>
      </form>
    </div>
  );
}