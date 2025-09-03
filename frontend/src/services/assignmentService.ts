import { apiClient } from '@/lib/apiClient';
import { GroupResponse, AgeGroup } from '@/types/groups';
import { PlayerDTO, Level } from '@/types/players';
import { PlayerAssignmentRequest, CoachAssignmentRequest } from '@/types/assignments';

export class AssignmentService {
  /**
   * Calculate the appropriate age group for a player based on their age
   */
  static getAgeGroup(dateOfBirth: string): AgeGroup | null {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= 4 && age <= 6) return AgeGroup.COOKIES;
    if (age >= 7 && age <= 10) return AgeGroup.DOLPHINS;
    if (age >= 11 && age <= 13) return AgeGroup.TIGERS;
    if (age >= 14 && age <= 16) return AgeGroup.LIONS;
    
    return null;
  }

  /**
   * Auto-assign player to appropriate group based on age and level
   */
  static async autoAssignPlayer(player: PlayerDTO): Promise<GroupResponse | null> {
    try {
      // Determine age group
      const ageGroup = player.dateOfBirth ? this.getAgeGroup(player.dateOfBirth) : null;
      
      if (!ageGroup) {
        throw new Error('Player age is outside supported range (4-16 years)');
      }

      // Fetch all groups
      const groups = await apiClient.get<GroupResponse[]>('/groups');
      
      // Filter groups by age group and level
      const eligibleGroups = groups.filter(group => 
        group.ageGroup === ageGroup && 
        group.level === player.level &&
        group.isActive &&
        !group.isFull
      );

      if (eligibleGroups.length === 0) {
        throw new Error(`No available ${player.level} group for ${ageGroup} age group`);
      }

      // Sort by available capacity (groups with more space first)
      eligibleGroups.sort((a, b) => {
        return b.availableSpots - a.availableSpots;
      });

      // Assign to group with most space
      const targetGroup = eligibleGroups[0];
      
      const request: PlayerAssignmentRequest = {
        playerId: player.id!,
        groupId: targetGroup.id
      };

      await apiClient.post('/groups/assign-player', request);
      
      return targetGroup;
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      return null;
    }
  }

  /**
   * Promote player from Development to Advanced level
   */
  static async promotePlayer(playerId: number): Promise<boolean> {
    try {
      // Get player details
      const player = await apiClient.get<PlayerDTO>(`/players/${playerId}`);
      
      if (player.level !== Level.DEVELOPMENT) {
        throw new Error('Only Development level players can be promoted');
      }

      // Update player level
      const updatedPlayer: PlayerDTO = {
        ...player,
        level: Level.ADVANCED
      };

      await apiClient.put(`/players/${playerId}`, updatedPlayer);

      // If player is assigned to a group, reassign to advanced group
      if (player.groupId) {
        // Remove from current group
        await apiClient.delete(`/groups/${player.groupId}/remove-player/${playerId}`);
        
        // Auto-assign to advanced group
        updatedPlayer.groupId = undefined;
        await this.autoAssignPlayer(updatedPlayer);
      }

      return true;
    } catch (error) {
      console.error('Promotion failed:', error);
      return false;
    }
  }

  /**
   * Reassign player to a different group
   */
  static async reassignPlayer(playerId: number, newGroupId: number): Promise<boolean> {
    try {
      const player = await apiClient.get<PlayerDTO>(`/players/${playerId}`);
      
      // Remove from current group if assigned
      if (player.groupId) {
        await apiClient.delete(`/groups/${player.groupId}/remove-player/${playerId}`);
      }

      // Assign to new group
      const request: PlayerAssignmentRequest = {
        playerId,
        groupId: newGroupId
      };

      await apiClient.post('/groups/assign-player', request);
      return true;
    } catch (error) {
      console.error('Reassignment failed:', error);
      return false;
    }
  }

  /**
   * Bulk assign multiple players
   */
  static async bulkAssignPlayers(playerIds: number[], groupId: number): Promise<{
    success: number[];
    failed: number[];
  }> {
    const success: number[] = [];
    const failed: number[] = [];

    for (const playerId of playerIds) {
      try {
        const request: PlayerAssignmentRequest = {
          playerId,
          groupId
        };
        
        await apiClient.post('/groups/assign-player', request);
        success.push(playerId);
      } catch (error) {
        console.error(`Failed to assign player ${playerId}:`, error);
        failed.push(playerId);
      }
    }

    return { success, failed };
  }

  /**
   * Auto-assign all unassigned players
   */
  static async autoAssignAllUnassigned(): Promise<{
    assigned: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const players = await apiClient.get<PlayerDTO[]>('/players');
      const unassigned = players.filter(p => !p.groupId && p.isActive);
      
      let assigned = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const player of unassigned) {
        const result = await this.autoAssignPlayer(player);
        if (result) {
          assigned++;
        } else {
          failed++;
          errors.push(`Failed to assign ${player.firstName} ${player.lastName}`);
        }
      }

      return { assigned, failed, errors };
    } catch (error) {
      console.error('Bulk auto-assignment failed:', error);
      return { assigned: 0, failed: 0, errors: ['Failed to fetch players'] };
    }
  }

  /**
   * Assign coach to group
   */
  static async assignCoach(coachId: number, groupId: number): Promise<boolean> {
    try {
      const request: CoachAssignmentRequest = {
        coachId,
        groupId
      };

      await apiClient.post('/groups/assign-coach', request);
      return true;
    } catch (error) {
      console.error('Coach assignment failed:', error);
      return false;
    }
  }

  /**
   * Remove coach from group
   */
  static async removeCoach(groupId: number, coachId: number): Promise<boolean> {
    try {
      await apiClient.delete(`/groups/${groupId}/remove-coach/${coachId}`);
      return true;
    } catch (error) {
      console.error('Coach removal failed:', error);
      return false;
    }
  }

  /**
   * Check if a group needs rebalancing
   */
  static async checkGroupBalance(groupId: number): Promise<{
    needsRebalancing: boolean;
    reason?: string;
  }> {
    try {
      const group = await apiClient.get<GroupResponse>(`/groups/${groupId}`);
      
      const capacity = group.currentPlayerCount || 0;
      const maxCapacity = group.capacity || 20;
      
      // Check if overfull
      if (capacity > maxCapacity) {
        return { 
          needsRebalancing: true, 
          reason: `Group is over capacity (${capacity}/${maxCapacity})` 
        };
      }

      // Check if too empty (less than 25% capacity)
      if (capacity > 0 && capacity < maxCapacity * 0.25) {
        return { 
          needsRebalancing: true, 
          reason: `Group is under 25% capacity (${capacity}/${maxCapacity})` 
        };
      }

      // Check if no coach assigned
      if (!group.coach) {
        return { 
          needsRebalancing: true, 
          reason: 'No coach assigned to group' 
        };
      }

      return { needsRebalancing: false };
    } catch (error) {
      console.error('Balance check failed:', error);
      return { needsRebalancing: false };
    }
  }

  /**
   * Get assignment recommendations for a player
   */
  static async getRecommendations(player: PlayerDTO): Promise<GroupResponse[]> {
    try {
      const groups = await apiClient.get<GroupResponse[]>('/groups');
      const ageGroup = player.dateOfBirth ? this.getAgeGroup(player.dateOfBirth) : null;
      
      if (!ageGroup) return [];

      // Filter and score groups
      const scoredGroups = groups
        .filter(g => 
          g.ageGroup === ageGroup && 
          g.level === player.level && 
          g.isActive &&
          !g.isFull
        )
        .map(group => ({
          group,
          score: this.calculateGroupScore(group, player)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.group);

      return scoredGroups.slice(0, 3); // Return top 3 recommendations
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate a score for group-player compatibility
   */
  private static calculateGroupScore(group: GroupResponse, player: PlayerDTO): number {
    let score = 100;

    // Prefer groups with coaches
    if (group.coach) score += 20;

    // Prefer groups with balanced capacity (40-80% full)
    const fillRate = (group.currentPlayerCount || 0) / (group.capacity || 20);
    if (fillRate >= 0.4 && fillRate <= 0.8) {
      score += 30;
    } else if (fillRate < 0.2) {
      score -= 20; // Penalize very empty groups
    } else if (fillRate > 0.9) {
      score -= 10; // Slightly penalize almost full groups
    }

    // Prefer groups with similar skill levels (if we had skill data)
    // This is placeholder for future enhancement
    
    return score;
  }

  /**
   * Validate promotion eligibility
   */
  static async validatePromotion(playerId: number): Promise<{
    eligible: boolean;
    reasons: string[];
  }> {
    try {
      const player = await apiClient.get<PlayerDTO>(`/players/${playerId}`);
      const reasons: string[] = [];
      let eligible = true;

      if (player.level !== Level.DEVELOPMENT) {
        eligible = false;
        reasons.push('Player is not in Development level');
      }

      if (!player.isActive) {
        eligible = false;
        reasons.push('Player is not active');
      }

      // Age check - typically players should be at least 10 for Advanced
      if (player.dateOfBirth) {
        const age = this.calculateAge(player.dateOfBirth);
        if (age < 10) {
          eligible = false;
          reasons.push('Player is too young for Advanced level (minimum age: 10)');
        }
      }

      // Additional criteria could be added here:
      // - Minimum time in Development
      // - Coach recommendations
      // - Assessment scores

      return { eligible, reasons };
    } catch (error) {
      console.error('Promotion validation failed:', error);
      return { eligible: false, reasons: ['Failed to validate promotion'] };
    }
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}