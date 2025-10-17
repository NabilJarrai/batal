// Assessment types matching backend DTOs and entities

import { SkillCategory } from './skills';

export enum AssessmentPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}

// Main Assessment interface matching AssessmentDTO.java
export interface Assessment {
  id: number;
  playerId: number;
  playerName: string;
  assessorId: number;
  assessorName: string;
  assessmentDate: string; // LocalDate as ISO string
  period: AssessmentPeriod;
  comments?: string;
  coachNotes?: string;
  isFinalized: boolean;
  createdAt: string; // LocalDateTime as ISO string  
  updatedAt: string; // LocalDateTime as ISO string
  skillScores: SkillScore[];
}

// Skill score within an assessment
export interface SkillScore {
  id?: number;
  skillId: number;
  skillName: string;
  skillCategory: SkillCategory;
  score: number; // 1-10 scale
  notes?: string;
}

// Request DTOs for API calls
export interface AssessmentCreateRequest {
  playerId: number;
  assessmentDate: string; // ISO date string
  period: AssessmentPeriod;
  comments?: string;
  coachNotes?: string;
  skillRatings: SkillScoreRequest[];
  isFinalized?: boolean;
}

export interface AssessmentUpdateRequest {
  assessmentDate: string;
  period: AssessmentPeriod;
  comments?: string;
  coachNotes?: string;
  isFinalized?: boolean;
  skillRatings: SkillScoreRequest[];
}

export interface SkillScoreRequest {
  skillId: number;
  score: number;
  notes?: string;
}

// Response DTO matching AssessmentResponse.java
export interface AssessmentResponse {
  id: number;
  playerId: number;
  playerName: string;
  assessorId: number;
  assessorName: string;
  assessmentDate: string;
  period: AssessmentPeriod;
  comments?: string;
  coachNotes?: string;
  isFinalized: boolean;
  skillScores: SkillScore[];
}

// UI specific types
export interface AssessmentFormData {
  playerId: number | null;
  assessmentDate: string;
  period: AssessmentPeriod;
  comments: string;
  coachNotes: string;
  skillScores: { [skillId: number]: SkillScoreFormData };
}

export interface SkillScoreFormData {
  skillId: number;
  score: number;
  notes: string;
}

export interface AssessmentFilters {
  playerId?: number;
  period?: AssessmentPeriod;
  dateFrom?: string;
  dateTo?: string;
  isFinalized?: boolean;
  assessorId?: number;
}

export interface AssessmentSummary {
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScoreByCategory: { [category in SkillCategory]: number };
}

// Assessment history for player progress tracking
export interface AssessmentHistory {
  playerId: number;
  playerName: string;
  assessments: Assessment[];
  progressTrend: ProgressData[];
}

export interface ProgressData {
  date: string;
  period: AssessmentPeriod;
  categoryScores: { [category in SkillCategory]: number };
  overallScore: number;
}

// Period display helpers
export const ASSESSMENT_PERIODS = [
  { key: AssessmentPeriod.MONTHLY, label: 'Monthly', description: 'Monthly assessment cycle' },
  { key: AssessmentPeriod.QUARTERLY, label: 'Quarterly', description: 'Quarterly assessment cycle' }
] as const;

// Utility functions
export const getPeriodInfo = (period: AssessmentPeriod) => {
  return ASSESSMENT_PERIODS.find(p => p.key === period);
};

export const getScoreColor = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Needs Improvement';
  return 'Poor';
};

export const calculateAverageScore = (skillScores: SkillScore[]): number => {
  if (!skillScores.length) return 0;
  const total = skillScores.reduce((sum, score) => sum + score.score, 0);
  return Math.round((total / skillScores.length) * 10) / 10;
};

export const calculateCategoryAverage = (
  skillScores: SkillScore[], 
  category: SkillCategory
): number => {
  const categoryScores = skillScores.filter(score => score.skillCategory === category);
  return calculateAverageScore(categoryScores);
};

export const isAssessmentComplete = (assessment: Partial<Assessment>): boolean => {
  return !!(
    assessment.playerId &&
    assessment.assessmentDate &&
    assessment.period &&
    assessment.skillScores?.length
  );
};

export const canFinalizeAssessment = (assessment: Assessment): boolean => {
  return isAssessmentComplete(assessment) && 
         assessment.skillScores.every(score => score.score > 0);
};