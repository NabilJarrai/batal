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

// Category display helpers with enhanced visual design
export const SKILL_CATEGORIES = [
  {
    key: SkillCategory.ATHLETIC,
    label: 'Athletic',
    icon: '⚡',
    emoji: '🏃‍♂️',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/30',
    textColor: 'text-blue-300',
    description: 'Physical abilities, strength, speed, agility'
  },
  {
    key: SkillCategory.TECHNICAL,
    label: 'Technical',
    icon: '⚽',
    emoji: '🎯',
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-400/30',
    textColor: 'text-green-300',
    description: 'Ball control, passing, shooting, dribbling'
  },
  {
    key: SkillCategory.MENTALITY,
    label: 'Mentality',
    icon: '🧠',
    emoji: '🎭',
    color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-300',
    description: 'Tactical awareness, game intelligence, vision'
  },
  {
    key: SkillCategory.PERSONALITY,
    label: 'Personality',
    icon: '✨',
    emoji: '💎',
    color: 'bg-gradient-to-br from-purple-700 to-purple-900',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400/30',
    textColor: 'text-purple-300',
    description: 'Character traits, leadership, creativity'
  }
] as const;

export const SKILL_LEVELS = [
  {
    key: SkillLevel.DEVELOPMENT,
    label: 'Development',
    shortLabel: 'Dev',
    icon: '🌱',
    color: 'bg-gradient-to-br from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-400/30',
    textColor: 'text-cyan-300',
    description: 'Foundation skills for young players'
  },
  {
    key: SkillLevel.ADVANCED,
    label: 'Advanced',
    shortLabel: 'Adv',
    icon: '🏆',
    color: 'bg-gradient-to-br from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-400/30',
    textColor: 'text-orange-300',
    description: 'Advanced skills for experienced players'
  }
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