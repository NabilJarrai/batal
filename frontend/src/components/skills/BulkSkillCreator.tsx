'use client';

import { useState } from 'react';
import { 
  SkillCreateRequest, 
  SkillCategory, 
  SkillLevel, 
  SKILL_CATEGORIES, 
  SKILL_LEVELS 
} from '@/types/skills';

interface BulkSkillCreatorProps {
  onSubmit: (skills: SkillCreateRequest[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface BulkSkillRow {
  name: string;
  description: string;
  category: SkillCategory;
  applicableLevel: SkillLevel;
  displayOrder: number;
}

export default function BulkSkillCreator({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: BulkSkillCreatorProps) {
  const [skills, setSkills] = useState<BulkSkillRow[]>([
    { name: '', description: '', category: SkillCategory.ATHLETIC, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 1 }
  ]);
  
  const [globalSettings, setGlobalSettings] = useState({
    category: SkillCategory.ATHLETIC,
    applicableLevel: SkillLevel.DEVELOPMENT,
    applyToAll: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const addSkillRow = () => {
    setSkills(prev => [...prev, {
      name: '',
      description: '',
      category: globalSettings.applyToAll ? globalSettings.category : SkillCategory.ATHLETIC,
      applicableLevel: globalSettings.applyToAll ? globalSettings.applicableLevel : SkillLevel.DEVELOPMENT,
      displayOrder: prev.length + 1
    }]);
  };

  const removeSkillRow = (index: number) => {
    setSkills(prev => {
      const newSkills = prev.filter((_, i) => i !== index);
      // Reorder display orders
      return newSkills.map((skill, i) => ({ ...skill, displayOrder: i + 1 }));
    });
  };

  const updateSkill = (index: number, field: keyof BulkSkillRow, value: any) => {
    setSkills(prev => prev.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    ));
  };

  const applyGlobalSettings = () => {
    if (globalSettings.applyToAll) {
      setSkills(prev => prev.map(skill => ({
        ...skill,
        category: globalSettings.category,
        applicableLevel: globalSettings.applicableLevel
      })));
    }
  };

  const validateSkills = (): boolean => {
    const newErrors: string[] = [];
    const skillNames = new Set<string>();

    skills.forEach((skill, index) => {
      if (!skill.name.trim()) {
        newErrors.push(`Skill ${index + 1}: Name is required`);
      } else if (skill.name.trim().length > 100) {
        newErrors.push(`Skill ${index + 1}: Name must not exceed 100 characters`);
      }
      
      if (skillNames.has(skill.name.trim().toLowerCase())) {
        newErrors.push(`Skill ${index + 1}: Duplicate skill name "${skill.name}"`);
      } else {
        skillNames.add(skill.name.trim().toLowerCase());
      }

      if (skill.description && skill.description.length > 500) {
        newErrors.push(`Skill ${index + 1}: Description must not exceed 500 characters`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateSkills()) return;

    setIsSubmitting(true);
    try {
      const skillRequests: SkillCreateRequest[] = skills.map((skill, index) => ({
        name: skill.name.trim(),
        description: skill.description.trim() || undefined,
        category: skill.category,
        applicableLevel: skill.applicableLevel,
        displayOrder: index + 1,
        isActive: true
      }));

      await onSubmit(skillRequests);
    } catch (error) {
      console.error('Bulk skill creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadDefaultSkills = () => {
    const defaultSkills: BulkSkillRow[] = [
      // Athletic Skills
      { name: 'General Motor Skills', description: 'Basic movement and coordination abilities', category: SkillCategory.ATHLETIC, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 1 },
      { name: 'Strength', description: 'Physical strength and power', category: SkillCategory.ATHLETIC, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 2 },
      { name: 'Running', description: 'Running technique and endurance', category: SkillCategory.ATHLETIC, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 3 },
      { name: 'Speed', description: 'Sprint speed and acceleration', category: SkillCategory.ATHLETIC, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 4 },
      
      // Technical Skills
      { name: 'Receiving/Control', description: 'Ball control and first touch', category: SkillCategory.TECHNICAL, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 5 },
      { name: 'Passing', description: 'Short and long passing accuracy', category: SkillCategory.TECHNICAL, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 6 },
      { name: 'Dribbling', description: 'Ball control while moving', category: SkillCategory.TECHNICAL, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 7 },
      { name: 'Shooting', description: 'Finishing and shot accuracy', category: SkillCategory.TECHNICAL, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 8 },
      { name: 'Defending', description: 'Tackling and defensive positioning', category: SkillCategory.TECHNICAL, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 9 },
      
      // Mentality Skills
      { name: 'Technical Player', description: 'Technical decision making', category: SkillCategory.MENTALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 10 },
      { name: 'Team Player', description: 'Teamwork and collaboration', category: SkillCategory.MENTALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 11 },
      { name: 'Game IQ', description: 'Game understanding and intelligence', category: SkillCategory.MENTALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 12 },
      
      // Personality Skills
      { name: 'Discipline', description: 'Self-control and following instructions', category: SkillCategory.PERSONALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 13 },
      { name: 'Coachable', description: 'Receptiveness to feedback and instruction', category: SkillCategory.PERSONALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 14 },
      { name: 'Flair', description: 'Creativity and flair in play', category: SkillCategory.PERSONALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 15 },
      { name: 'Creativity', description: 'Creative thinking and problem solving', category: SkillCategory.PERSONALITY, applicableLevel: SkillLevel.DEVELOPMENT, displayOrder: 16 }
    ];

    setSkills(defaultSkills);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Bulk Skill Creator</h3>
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

      {/* Global Settings */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-3">Global Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Default Category
            </label>
            <select
              value={globalSettings.category}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, category: e.target.value as SkillCategory }))}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {SKILL_CATEGORIES.map(category => (
                <option key={category.key} value={category.key}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Default Level
            </label>
            <select
              value={globalSettings.applicableLevel}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, applicableLevel: e.target.value as SkillLevel }))}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {SKILL_LEVELS.map(level => (
                <option key={level.key} value={level.key}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={globalSettings.applyToAll}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, applyToAll: e.target.checked }))}
                  className="w-4 h-4 text-cyan-600 bg-white/10 border-white/20 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-blue-200">Apply to all skills</span>
              </label>
              <button
                onClick={applyGlobalSettings}
                disabled={!globalSettings.applyToAll}
                className="px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={loadDefaultSkills}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Load Default Skills (16)
        </button>
        <button
          onClick={addSkillRow}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Add Skill Row
        </button>
        <span className="px-3 py-2 bg-white/10 text-blue-200 rounded-lg text-sm">
          {skills.length} skill{skills.length !== 1 ? 's' : ''} to create
        </span>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <h4 className="text-red-300 font-medium mb-2">Please fix the following errors:</h4>
          <ul className="text-red-200 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills Table */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left text-blue-200 font-medium py-3 px-2 w-8">#</th>
              <th className="text-left text-blue-200 font-medium py-3 px-2">Skill Name *</th>
              <th className="text-left text-blue-200 font-medium py-3 px-2">Category</th>
              <th className="text-left text-blue-200 font-medium py-3 px-2">Level</th>
              <th className="text-left text-blue-200 font-medium py-3 px-2">Description</th>
              <th className="text-left text-blue-200 font-medium py-3 px-2 w-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => (
              <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-2 px-2 text-gray-400 text-sm">
                  {index + 1}
                </td>
                
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    placeholder="Enter skill name"
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    maxLength={100}
                  />
                </td>
                
                <td className="py-2 px-2">
                  <select
                    value={skill.category}
                    onChange={(e) => updateSkill(index, 'category', e.target.value as SkillCategory)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {SKILL_CATEGORIES.map(category => (
                      <option key={category.key} value={category.key}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </td>
                
                <td className="py-2 px-2">
                  <select
                    value={skill.applicableLevel}
                    onChange={(e) => updateSkill(index, 'applicableLevel', e.target.value as SkillLevel)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {SKILL_LEVELS.map(level => (
                      <option key={level.key} value={level.key}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </td>
                
                <td className="py-2 px-2">
                  <input
                    type="text"
                    value={skill.description}
                    onChange={(e) => updateSkill(index, 'description', e.target.value)}
                    placeholder="Optional description"
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    maxLength={500}
                  />
                </td>
                
                <td className="py-2 px-2">
                  <button
                    onClick={() => removeSkillRow(index)}
                    disabled={skills.length === 1}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || skills.length === 0}
          className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(isSubmitting || isLoading) && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Create {skills.length} Skill{skills.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}