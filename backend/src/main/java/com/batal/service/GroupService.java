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
import java.util.Optional;
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
        // Check if group with same level, ageGroup, and groupNumber already exists
        Optional<Group> existingGroup = groupRepository.findByLevelAndAgeGroupAndGroupNumber(
            request.getLevel(), request.getAgeGroup(), request.getGroupNumber());
        
        if (existingGroup.isPresent()) {
            throw new RuntimeException("Group with same level, age group, and number already exists");
        }
        
        Group group = new Group();
        group.setLevel(request.getLevel());
        group.setAgeGroup(request.getAgeGroup());
        group.setGroupNumber(request.getGroupNumber());
        group.setCapacity(request.getCapacity());
        group.setZone(request.getZone());
        group.setDescription(request.getDescription());
        group.setIsActive(true);
        
        // Set min and max age based on age group
        group.setMinAge(request.getAgeGroup().getMinAge());
        group.setMaxAge(request.getAgeGroup().getMaxAge());
        
        // Generate group name
        String suffix = request.getGroupNumber() > 1 ? " " + request.getGroupNumber() : "";
        group.setName(request.getLevel().getDisplayName() + " " + 
                     request.getAgeGroup().getDisplayName() + suffix);
        
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
        
        // Update fields only if provided
        if (request.getLevel() != null) {
            group.setLevel(request.getLevel());
        }
        if (request.getAgeGroup() != null) {
            group.setAgeGroup(request.getAgeGroup());
            group.setMinAge(request.getAgeGroup().getMinAge());
            group.setMaxAge(request.getAgeGroup().getMaxAge());
        }
        if (request.getGroupNumber() != null) {
            group.setGroupNumber(request.getGroupNumber());
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
        
        // Regenerate name if level, ageGroup, or groupNumber changed
        if (request.getLevel() != null || request.getAgeGroup() != null || request.getGroupNumber() != null) {
            String suffix = group.getGroupNumber() > 1 ? " " + group.getGroupNumber() : "";
            group.setName(group.getLevel().getDisplayName() + " " + 
                         group.getAgeGroup().getDisplayName() + suffix);
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
            
            // Check age compatibility
            int playerAge = LocalDate.now().getYear() - player.getDateOfBirth().getYear();
            if (playerAge < group.getMinAge() || playerAge > group.getMaxAge()) {
                throw new RuntimeException("Player age (" + playerAge + ") is not compatible with group age range (" + 
                                         group.getMinAge() + "-" + group.getMaxAge() + ")");
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
        
        // Find available group with matching level and age group
        List<Group> availableGroups = groupRepository.findAvailableGroupsByLevelAndAgeGroup(
            player.getLevel(), ageGroup);
        
        if (availableGroups.isEmpty()) {
            // Create new group if none available
            GroupCreateRequest groupRequest = new GroupCreateRequest(player.getLevel(), ageGroup);
            
            // Find next group number
            List<Group> existingGroups = groupRepository.findByLevelAndAgeGroup(player.getLevel(), ageGroup);
            int nextGroupNumber = existingGroups.size() + 1;
            groupRequest.setGroupNumber(nextGroupNumber);
            
            GroupResponse newGroup = createGroup(groupRequest);
            
            // Assign player to the new group
            GroupAssignmentRequest assignmentRequest = new GroupAssignmentRequest(
                playerId, newGroup.getId(), "Auto-assigned to new group");
            return assignPlayerToGroup(assignmentRequest);
        } else {
            // Assign to first available group
            Group targetGroup = availableGroups.get(0);
            GroupAssignmentRequest assignmentRequest = new GroupAssignmentRequest(
                playerId, targetGroup.getId(), "Auto-assigned to existing group");
            return assignPlayerToGroup(assignmentRequest);
        }
    }
}