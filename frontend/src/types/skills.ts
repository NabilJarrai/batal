export enum SkillCategory {
  ATHLETIC = 'ATHLETIC',
  TECHNICAL = 'TECHNICAL', 
  MENTALITY = 'MENTALITY',
  PERSONALITY = 'PERSONALITY'
}

export enum SkillLevel {
  DEVELOPMENT = 'DEVELOPMENT',
  ADVANCED = 'ADVANCED'
}

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  applicableLevels: SkillLevel[];
  description?: string;
  displayOrder: number;
  isActive: boolean;
  canDelete: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillCreateRequest {
  name: string;
  category: SkillCategory;
  applicableLevels: SkillLevel[];
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface SkillUpdateRequest {
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface SkillOrderRequest {
  skillId: number;
  newOrder: number;
}

export interface SkillFilters {
  category?: SkillCategory;
  level?: SkillLevel;
  activeOnly?: boolean;
}

// Helper interfaces for UI components
export interface SkillFormData {
  name: string;
  category: SkillCategory;
  applicableLevels: SkillLevel[];
  description: string;
  isActive: boolean;
}

export interface BulkSkillData {
  skills: SkillCreateRequest[];
  category: SkillCategory;
  applicableLevels: SkillLevel[];
}

// Category display helpers
export const SKILL_CATEGORIES = [
  { key: SkillCategory.ATHLETIC, label: 'Athletic', icon: '💪', color: 'bg-blue-500' },
  { key: SkillCategory.TECHNICAL, label: 'Technical', icon: '⚽', color: 'bg-green-500' },
  { key: SkillCategory.MENTALITY, label: 'Mentality', icon: '🧠', color: 'bg-purple-500' },
  { key: SkillCategory.PERSONALITY, label: 'Personality', icon: '🌟', color: 'bg-yellow-500' }
] as const;

export const SKILL_LEVELS = [
  { key: SkillLevel.DEVELOPMENT, label: 'Development', color: 'bg-cyan-500' },
  { key: SkillLevel.ADVANCED, label: 'Advanced', color: 'bg-orange-500' }
] as const;

// Utility functions
export const getCategoryInfo = (category: SkillCategory) => {
  return SKILL_CATEGORIES.find(c => c.key === category);
};

export const getLevelInfo = (level: SkillLevel) => {
  return SKILL_LEVELS.find(l => l.key === level);
};

export const getCategoryColor = (category: SkillCategory): string => {
  return getCategoryInfo(category)?.color || 'bg-gray-500';
};

export const getLevelColor = (level: SkillLevel): string => {
  return getLevelInfo(level)?.color || 'bg-gray-500';
};

export const getLevelsDisplayText = (levels: SkillLevel[]): string => {
  if (!levels || levels.length === 0) return 'None';
  if (levels.length === 2) return 'Both';
  return levels.map(level => getLevelInfo(level)?.label || level).join(', ');
};

export const isApplicableForLevel = (skill: Skill, level: SkillLevel): boolean => {
  return skill.applicableLevels?.includes(level) || false;
};