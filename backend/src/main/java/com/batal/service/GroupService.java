package com.batal.service;

import com.batal.dto.*;
import com.batal.entity.Group;
import com.batal.entity.Player;
import com.batal.entity.Pitch;
import com.batal.entity.User;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.UserType;
import com.batal.repository.GroupRepository;
import com.batal.repository.PlayerRepository;
import com.batal.repository.PitchRepository;
import com.batal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private PlayerRepository playerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PitchRepository pitchRepository;

    // Create new group
    public GroupResponse createGroup(GroupCreateRequest request) {
        Group group = new Group();
        group.setName(request.getName());
        group.setLevel(request.getLevel());
        group.setAgeGroup(request.getAgeGroup());
        group.setCapacity(request.getCapacity());
        group.setZone(request.getZone());
        group.setDescription(request.getDescription());
        group.setIsActive(true);
        
        // Set min and max age - use custom values if provided, otherwise use defaults from age group
        group.setMinAge(request.getMinAge() != null ? request.getMinAge() : request.getAgeGroup().getMinAge());
        group.setMaxAge(request.getMaxAge() != null ? request.getMaxAge() : request.getAgeGroup().getMaxAge());
        
        // Assign coach if provided
        if (request.getCoachId() != null) {
            User coach = userRepository.findById(request.getCoachId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
            
            if (!coach.getUserType().equals(UserType.COACH)) {
                throw new RuntimeException("User is not a coach");
            }
            group.setCoach(coach);
        }
        
        // Assign pitch if provided
        if (request.getPitchId() != null) {
            Pitch pitch = pitchRepository.findById(request.getPitchId())
                .orElseThrow(() -> new RuntimeException("Pitch not found"));
            group.setPitch(pitch);
        }
        
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Get all groups with optional filters
    public Page<GroupResponse> getAllGroups(Level level, AgeGroup ageGroup, Boolean isActive, Pageable pageable) {
        Page<Group> groups;
        
        if (level != null || ageGroup != null || isActive != null) {
            groups = groupRepository.findGroupsWithFilters(level, ageGroup, isActive, pageable);
        } else {
            groups = groupRepository.findAll(pageable);
        }
        
        return groups.map(GroupResponse::new);
    }

    // Get group by ID
    public GroupResponse getGroupById(Long id) {
        Group group = groupRepository.findByIdWithPlayersAndCoach(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        return new GroupResponse(group);
    }

    // Update group
    public GroupResponse updateGroup(Long id, GroupUpdateRequest request) {
        Group group = groupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // No more unique constraint checking - allow flexible naming
        
        // Update fields only if provided
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getLevel() != null) {
            group.setLevel(request.getLevel());
        }
        if (request.getAgeGroup() != null) {
            group.setAgeGroup(request.getAgeGroup());
            // Only update age range from AgeGroup if custom values not provided
            if (request.getMinAge() == null) {
                group.setMinAge(request.getAgeGroup().getMinAge());
            }
            if (request.getMaxAge() == null) {
                group.setMaxAge(request.getAgeGroup().getMaxAge());
            }
        }
        // Allow custom age range overrides
        if (request.getMinAge() != null) {
            group.setMinAge(request.getMinAge());
        }
        if (request.getMaxAge() != null) {
            group.setMaxAge(request.getMaxAge());
        }
        if (request.getCapacity() != null) {
            group.setCapacity(request.getCapacity());
        }
        if (request.getZone() != null) {
            group.setZone(request.getZone());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            group.setIsActive(request.getIsActive());
        }
        
        // Update coach if provided
        if (request.getCoachId() != null) {
            User coach = userRepository.findById(request.getCoachId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));
            
            if (!coach.getUserType().equals(UserType.COACH)) {
                throw new RuntimeException("User is not a coach");
            }
            group.setCoach(coach);
        }
        
        // Update pitch if provided
        if (request.getPitchId() != null) {
            Pitch pitch = pitchRepository.findById(request.getPitchId())
                .orElseThrow(() -> new RuntimeException("Pitch not found"));
            group.setPitch(pitch);
        }
        
        
        group.setUpdatedAt(LocalDateTime.now());
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Delete group
    public void deleteGroup(Long id) {
        Group group = groupRepository.findByIdWithPlayersAndCoach(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        if (!group.getPlayers().isEmpty()) {
            throw new RuntimeException("Cannot delete group with assigned players. Please reassign players first.");
        }
        
        groupRepository.delete(group);
    }

    // Assign player to group
    public GroupResponse assignPlayerToGroup(GroupAssignmentRequest request) {
        Player player = playerRepository.findById(request.getPlayerId())
            .orElseThrow(() -> new RuntimeException("Player not found"));
        
        Group group = groupRepository.findByIdWithPlayersAndCoach(request.getGroupId())
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Validation checks (unless forced)
        if (!request.getForceAssignment()) {
            // Check if group has capacity
            if (group.isFull()) {
                throw new RuntimeException("Group is at full capacity (" + group.getCapacity() + " players)");
            }
        }
        
        // Remove player from current group if assigned
        if (player.getGroup() != null) {
            Group currentGroup = player.getGroup();
            currentGroup.removePlayer(player);
            groupRepository.save(currentGroup);
        }

        // Assign player to new group
        group.addPlayer(player);
        player.setGroup(group);

        playerRepository.save(player);
        Group savedGroup = groupRepository.save(group);

        return new GroupResponse(savedGroup);
    }

    // Remove player from group
    public GroupResponse removePlayerFromGroup(Long groupId, Long playerId) {
        Group group = groupRepository.findByIdWithPlayersAndCoach(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));
        
        if (player.getGroup() == null || !player.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Player is not assigned to this group");
        }

        group.removePlayer(player);
        player.setGroup(null);

        playerRepository.save(player);
        Group savedGroup = groupRepository.save(group);
        
        return new GroupResponse(savedGroup);
    }

    // Assign coach to group
    public GroupResponse assignCoachToGroup(CoachAssignmentRequest request) {
        User coach = userRepository.findById(request.getCoachId())
            .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        if (!coach.getUserType().equals(UserType.COACH)) {
            throw new RuntimeException("User is not a coach");
        }
        
        Group group = groupRepository.findById(request.getGroupId())
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        group.setCoach(coach);
        group.setUpdatedAt(LocalDateTime.now());
        
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Remove coach from group
    public GroupResponse removeCoachFromGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        group.setCoach(null);
        group.setUpdatedAt(LocalDateTime.now());
        
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Get available groups (with capacity)
    public List<GroupResponse> getAvailableGroups() {
        List<Group> groups = groupRepository.findAvailableGroups();
        return groups.stream()
            .map(GroupResponse::new)
            .collect(Collectors.toList());
    }

    // Get groups by level
    public List<GroupResponse> getGroupsByLevel(Level level) {
        List<Group> groups = groupRepository.findByLevelAndIsActiveTrue(level);
        return groups.stream()
            .map(GroupResponse::new)
            .collect(Collectors.toList());
    }

    // Get groups by age group
    public List<GroupResponse> getGroupsByAgeGroup(AgeGroup ageGroup) {
        List<Group> groups = groupRepository.findByAgeGroupAndIsActiveTrue(ageGroup);
        return groups.stream()
            .map(GroupResponse::new)
            .collect(Collectors.toList());
    }

    // Get coach's assigned groups
    public List<GroupResponse> getCoachGroups(Long coachId) {
        User coach = userRepository.findById(coachId)
            .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        if (!coach.getUserType().equals(UserType.COACH)) {
            throw new RuntimeException("User is not a coach");
        }
        
        List<Group> groups = groupRepository.findByCoachId(coachId);
        return groups.stream()
            .map(GroupResponse::new)
            .collect(Collectors.toList());
    }

    // Activate group
    public GroupResponse activateGroup(Long id) {
        Group group = groupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        group.setIsActive(true);
        group.setUpdatedAt(LocalDateTime.now());
        
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Deactivate group
    public GroupResponse deactivateGroup(Long id) {
        Group group = groupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        group.setIsActive(false);
        group.setUpdatedAt(LocalDateTime.now());
        
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    // Auto-assign player to appropriate group
    public GroupResponse autoAssignPlayerToGroup(Long playerId) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));
        
        // Calculate player age
        int playerAge = LocalDate.now().getYear() - player.getDateOfBirth().getYear();
        AgeGroup ageGroup = AgeGroup.getByAge(playerAge);

        if (ageGroup == null) {
            throw new RuntimeException("Player age (" + playerAge + ") is not within supported age range");
        }

        // Use the player's actual level, not hardcoded level
        Level playerLevel = player.getLevel();
        
        // Find available group with matching level and age group
        List<Group> availableGroups = groupRepository.findAvailableGroupsByLevelAndAgeGroup(
            playerLevel, ageGroup);
        
        if (availableGroups.isEmpty()) {
            // Create new group if none available  
            List<Group> existingGroups = groupRepository.findByLevelAndAgeGroup(playerLevel, ageGroup);
            int nextGroupNumber = existingGroups.size() + 1;
            String groupName = playerLevel.getDisplayName() + " " + ageGroup.getDisplayName();
            if (nextGroupNumber > 1) {
                groupName += " " + nextGroupNumber;
            }
            
            GroupCreateRequest groupRequest = new GroupCreateRequest(groupName, playerLevel, ageGroup);
            GroupResponse newGroup = createGroup(groupRequest);
            
            // Assign player to the new group with force assignment for flexibility
            GroupAssignmentRequest assignmentRequest = new GroupAssignmentRequest(
                playerId, newGroup.getId(), "Auto-assigned to new " + playerLevel + " group");
            assignmentRequest.setForceAssignment(true);
            return assignPlayerToGroup(assignmentRequest);
        } else {
            // Assign to first available group
            Group targetGroup = availableGroups.get(0);
            GroupAssignmentRequest assignmentRequest = new GroupAssignmentRequest(
                playerId, targetGroup.getId(), "Auto-assigned to existing " + playerLevel + " group");
            assignmentRequest.setForceAssignment(true);
            return assignPlayerToGroup(assignmentRequest);
        }
    }

    // Get available groups for a specific player (based on age, level, capacity)
    public List<GroupResponse> getAvailableGroupsForPlayer(Long playerId) {
        Player player = playerRepository.findByIdWithGroup(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found with ID: " + playerId));

        // Calculate player age
        int playerAge = calculatePlayerAge(player.getDateOfBirth());

        // Get player's current level (default to DEVELOPMENT if null)
        Level playerLevel = player.getLevel() != null ? player.getLevel() : Level.DEVELOPMENT;

        // Find all active groups that can accommodate this player
        List<Group> availableGroups = groupRepository.findAll().stream()
            .filter(group -> {
                // Group must be active
                if (!group.getIsActive()) return false;

                // Group must have capacity (unless it's the player's current group)
                if (group.isFull() && !group.equals(player.getGroup())) return false;
                
                // Age must be within group's age range (with some flexibility)
                if (playerAge > 0) { // Only check if we have a valid age
                    if (playerAge < group.getMinAge() - 1 || playerAge > group.getMaxAge() + 1) {
                        return false;
                    }
                }
                
                return true;
            })
            .collect(Collectors.toList());
        
        // Convert to DTOs and sort by relevance (same level first, then by age group match)
        return availableGroups.stream()
            .map(this::mapToGroupResponse)
            .sorted((g1, g2) -> {
                // Prioritize groups of the same level
                boolean g1SameLevel = g1.getLevel().equals(playerLevel);
                boolean g2SameLevel = g2.getLevel().equals(playerLevel);
                
                if (g1SameLevel && !g2SameLevel) return -1;
                if (!g1SameLevel && g2SameLevel) return 1;
                
                // Then prioritize by available spots (more spots = better)
                return Integer.compare(g2.getAvailableSpots(), g1.getAvailableSpots());
            })
            .collect(Collectors.toList());
    }
    
    // Helper method to calculate player age
    private int calculatePlayerAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 0; // Unknown age
        }
        return LocalDate.now().getYear() - dateOfBirth.getYear();
    }
    
    // Helper method to map Group to GroupResponse (simplified version)
    private GroupResponse mapToGroupResponse(Group group) {
        GroupResponse response = new GroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setLevel(group.getLevel());
        response.setAgeGroup(group.getAgeGroup());
        response.setMinAge(group.getMinAge());
        response.setMaxAge(group.getMaxAge());
        response.setCapacity(group.getCapacity());
        response.setCurrentPlayerCount(group.getCurrentPlayerCount());
        response.setAvailableSpots(group.getAvailableSpots());
        response.setIsFull(group.isFull());
        response.setZone(group.getZone());
        response.setDescription(group.getDescription());
        response.setIsActive(group.getIsActive());
        response.setCreatedAt(group.getCreatedAt());
        response.setUpdatedAt(group.getUpdatedAt());
        
        // Simplified mapping - coach and players would need more complex mapping if needed
        if (group.getCoach() != null) {
            response.setCoach(new UserResponse()); // Simplified - you'd map coach details here
        }
        
        return response;
    }
}