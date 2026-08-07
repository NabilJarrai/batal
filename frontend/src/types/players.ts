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
  dateOfBirth?: string; // ISO date string
  gender?: Gender;
  address?: string;
  parentId?: number;
  parentName?: string; // read-only, computed from parent User
  // Second parent, read-only. Owned by the main parent's account, so update
  // it through the parent, not the player.
  secondaryParentName?: string;
  secondaryParentEmail?: string;
  secondaryParentPhone?: string;
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

  // Player-specific fields
  playerNumber?: string;
  position?: string;
}

// Player Create Request
export type PlayerCreateRequest = Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'>;

// Details for a main parent who does not exist yet. Email and mobile are
// required: they are the academy's contact route and the parent's login.
export interface NewParentDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  // The family's second guardian. Contact only, so both are optional.
  secondaryParentName?: string;
  secondaryParentEmail?: string;
  secondaryParentPhone?: string;
}

// Create one or more players under a single main parent, in one transaction.
// Supply exactly one of parentId or newParent.
export interface CreatePlayersRequest {
  parentId?: number;
  newParent?: NewParentDetails;
  players: PlayerCreateRequest[];
  autoAssignGroup?: boolean;
}

export interface CreatePlayersResponse {
  players: PlayerDTO[];
  parent: import('./users').UserResponse;
  parentCreated: boolean;
}

// Player Update Request  
export type PlayerUpdateRequest = Partial<Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'>>;

// Player Form Data (for frontend forms)
export type PlayerFormData = Omit<PlayerDTO, 'id' | 'createdAt' | 'updatedAt'> & {
  // Form-specific fields can be added here when needed
};

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