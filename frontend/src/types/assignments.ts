// Assignment system types for managing coach and player assignments

import { UserResponse } from './users';
import { PlayerDTO } from './players';
import { GroupResponse } from './groups';

// Assignment Types
export enum AssignmentType {
  PLAYER_TO_GROUP = "PLAYER_TO_GROUP",
  COACH_TO_GROUP = "COACH_TO_GROUP",
  PLAYER_PROMOTION = "PLAYER_PROMOTION"
}

export enum AssignmentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED", 
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

// Base Assignment Interface
export interface BaseAssignment {
  id?: number;
  type: AssignmentType;
  status: AssignmentStatus;
  assignedBy?: UserResponse;
  assignedAt: string; // ISO datetime string
  notes?: string;
  error?: string; // In case of failure
}

// Player Assignment (Player to Group)
export interface PlayerAssignment extends BaseAssignment {
  type: AssignmentType.PLAYER_TO_GROUP;
  player: PlayerDTO;
  fromGroup?: GroupResponse;
  toGroup: GroupResponse;
  isAutoAssignment: boolean;
}

// Coach Assignment (Coach to Group)
export interface CoachAssignment extends BaseAssignment {
  type: AssignmentType.COACH_TO_GROUP;
  coach: UserResponse;
  group: GroupResponse;
  previousCoach?: UserResponse;
}

// Player Promotion Assignment
export interface PlayerPromotionAssignment extends BaseAssignment {
  type: AssignmentType.PLAYER_PROMOTION;
  player: PlayerDTO;
  fromLevel: string;
  toLevel: string;
  fromGroup?: GroupResponse;
  toGroup?: GroupResponse;
  promotionReason?: string;
}

// Union type for all assignments
export type Assignment = PlayerAssignment | CoachAssignment | PlayerPromotionAssignment;

// Assignment Request Types
export interface PlayerAssignmentRequest {
  playerId: number;
  groupId: number;
  notes?: string;
}

export interface CoachAssignmentRequest {
  coachId: number;
  groupId: number;
  notes?: string;
}

export interface PlayerPromotionRequest {
  playerId: number;
  promotionReason?: string;
  notes?: string;
}

// Bulk Assignment Types
export interface BulkPlayerAssignmentRequest {
  playerIds: number[];
  groupId?: number; // If not provided, will auto-assign to appropriate groups
  notes?: string;
}

export interface BulkAssignmentResult {
  successful: PlayerAssignment[];
  failed: Array<{
    playerId: number;
    playerName: string;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Assignment History
export interface AssignmentHistory {
  assignments: Assignment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Assignment Filters
export interface AssignmentFilters {
  type?: AssignmentType;
  status?: AssignmentStatus;
  assignedBy?: number; // User ID
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  playerId?: number;
  coachId?: number;
  groupId?: number;
}

// Assignment Statistics
export interface AssignmentStats {
  totalAssignments: number;
  assignmentsByType: {
    [K in AssignmentType]: number;
  };
  assignmentsByStatus: {
    [K in AssignmentStatus]: number;
  };
  recentAssignments: Assignment[];
  pendingAssignments: Assignment[];
  failedAssignments: Assignment[];
}

// Auto-assignment results
export interface AutoAssignmentResult {
  playerId: number;
  playerName: string;
  success: boolean;
  assignedGroup?: GroupResponse;
  error?: string;
  message: string;
}

export interface BulkAutoAssignmentResult {
  results: AutoAssignmentResult[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  summary: string;
}

// Assignment workflow states
export interface AssignmentWorkflow {
  canAssignPlayer: boolean;
  canAssignCoach: boolean;
  canPromotePlayer: boolean;
  availableGroups: GroupResponse[];
  availableCoaches: UserResponse[];
  unassignedPlayers: PlayerDTO[];
  groupsNeedingCoaches: GroupResponse[];
}

// Assignment validation
export interface AssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Assignment modal/form states
export interface AssignmentModalState {
  isOpen: boolean;
  type: AssignmentType | null;
  selectedPlayer?: PlayerDTO;
  selectedCoach?: UserResponse;
  selectedGroup?: GroupResponse;
  isLoading: boolean;
  error?: string;
}