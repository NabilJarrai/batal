// Group management types matching backend DTOs

import { UserResponse } from './users';
import { PlayerDTO, Level } from './players';

export { Level } from './players';

// Enums matching backend enums
export enum AgeGroup {
  COOKIES = "COOKIES",
  DOLPHINS = "DOLPHINS",
  TIGERS = "TIGERS",
  LIONS = "LIONS"
}

// Age Group metadata (matches backend AgeGroup enum methods)
export const AGE_GROUP_METADATA = {
  [AgeGroup.COOKIES]: { displayName: "Cookies", minAge: 4, maxAge: 6 },
  [AgeGroup.DOLPHINS]: { displayName: "Dolphins", minAge: 7, maxAge: 10 },
  [AgeGroup.TIGERS]: { displayName: "Tigers", minAge: 11, maxAge: 13 },
  [AgeGroup.LIONS]: { displayName: "Lions", minAge: 14, maxAge: 16 }
};

// Group Response (matches backend GroupResponse.java)
export interface GroupResponse {
  id: number;
  name: string;
  level: Level;
  ageGroup: AgeGroup;
  groupNumber?: number;
  minAge: number;
  maxAge: number;
  capacity: number;
  currentPlayerCount: number;
  availableSpots: number;
  isFull: boolean;
  zone?: string;
  description?: string;
  isActive: boolean;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
  
  // Coach information
  coach?: UserResponse;
  
  // Pitch information
  pitchId?: number;
  pitchName?: string;
  
  // Players information
  players: PlayerDTO[];
}

// Group Create Request (matches backend GroupCreateRequest.java)
export interface GroupCreateRequest {
  level: Level;
  ageGroup: AgeGroup;
  capacity: number;
  coachId?: number;
  zone?: string;
  description?: string;
  isActive?: boolean;
}

// Group Update Request (matches backend GroupUpdateRequest.java)
export interface GroupUpdateRequest {
  capacity?: number;
  zone?: string;
  description?: string;
  isActive?: boolean;
}

// Removed CoachAssignmentRequest - now in assignments.ts

// Group Assignment Request (matches backend GroupAssignmentRequest.java) 
export interface GroupAssignmentRequest {
  playerId: number;
  groupId: number;
}

// Group Form Data (for frontend forms)
export type GroupFormData = GroupCreateRequest & {
  // Form-specific fields can be added here when needed
};

// Group Filters
export interface GroupFilters {
  level?: Level;
  ageGroup?: AgeGroup;
  isActive?: boolean;
  hasCoach?: boolean;
  hasAvailableSpots?: boolean;
  coachId?: number;
  searchTerm?: string;
}

// Group Statistics
export interface GroupStats {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  levelDistribution: {
    development: number;
    advanced: number;
  };
  ageGroupDistribution: {
    [K in AgeGroup]: number;
  };
  capacityUtilization: {
    totalCapacity: number;
    totalPlayers: number;
    utilizationPercentage: number;
  };
  groupsWithoutCoach: number;
  fullGroups: number;
}

// Group Assignment Statistics
export interface GroupAssignmentStats {
  totalAssignments: number;
  unassignedPlayers: number;
  groupsNeedingPlayers: GroupResponse[];
  playersAwaitingAssignment: PlayerDTO[];
}

// Utility types
export type GroupSortBy = 'name' | 'level' | 'ageGroup' | 'currentPlayerCount' | 'availableSpots' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface GroupSortOptions {
  sortBy: GroupSortBy;
  direction: SortDirection;
}

// Helper function types
export type GetGroupsByLevel = (level: Level) => Promise<GroupResponse[]>;
export type GetGroupsByAgeGroup = (ageGroup: AgeGroup) => Promise<GroupResponse[]>;
export type GetAvailableGroups = () => Promise<GroupResponse[]>;
export type AutoAssignPlayerToGroup = (playerId: number) => Promise<GroupResponse>;