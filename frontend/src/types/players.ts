// Player management types matching backend DTOs

import { Gender } from './users';

// Enums matching backend enums
export enum Level {
  DEVELOPMENT = "DEVELOPMENT",
  ADVANCED = "ADVANCED"
}

export enum BasicFoot {
  LEFT = "LEFT", 
  RIGHT = "RIGHT"
}

// Player DTO (matches backend PlayerDTO.java)
export interface PlayerDTO {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  parentName: string;
  joiningDate?: string; // ISO date string
  level: Level;
  basicFoot?: BasicFoot;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive?: boolean;
  inactiveReason?: string;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
  
  // Group information
  groupId?: number;
  groupName?: string;
}

// Player Create Request
export interface PlayerCreateRequest extends Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // All required fields from PlayerDTO except auto-generated ones
}

// Player Update Request  
export interface PlayerUpdateRequest extends Partial<Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'>> {
  // All fields optional for updates except auto-generated ones
}

// Player Form Data (for frontend forms)
export interface PlayerFormData extends Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Form-specific fields can be added here
}

// Player Filters
export interface PlayerFilters {
  isActive?: boolean;
  level?: Level;
  gender?: Gender;
  basicFoot?: BasicFoot;
  groupId?: number;
  searchTerm?: string;
  ageMin?: number;
  ageMax?: number;
}

// Player Statistics
export interface PlayerStats {
  totalActivePlayers: number;
  totalInactivePlayers: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  levelDistribution: {
    development: number;
    advanced: number;
  };
  ageGroupDistribution: {
    [key: string]: number; // e.g., "4-6": 15, "7-10": 23, etc.
  };
  footDistribution: {
    left: number;
    right: number;
  };
}

// Player Assignment data
export interface PlayerAssignmentData {
  playerId: number;
  groupId: number;
  assignedBy?: number; // User ID who performed the assignment
  assignedAt?: string; // ISO datetime string
}

// Player Promotion data
export interface PlayerPromotionData {
  playerId: number;
  fromLevel: Level;
  toLevel: Level;
  promotedBy?: number; // User ID who performed the promotion
  promotedAt?: string; // ISO datetime string
  reason?: string;
}