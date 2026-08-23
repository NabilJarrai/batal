package com.batal.service;

import com.batal.dto.*;
import com.batal.entity.AssessmentTemplate;
import com.batal.entity.Group;
import com.batal.entity.Player;
import com.batal.entity.User;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.UserType;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.AssessmentTemplateRepository;
import com.batal.repository.GroupRepository;
import com.batal.repository.PlayerRepository;
import com.batal.repository.UserRepository;
import com.batal.util.AgeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private AssessmentTemplateRepository assessmentTemplateRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserRepository userRepository;

    // Create new group
    public GroupResponse createGroup(GroupCreateRequest request) {
        Group group = new Group();
        group.setName(request.getName());
        group.setLevel(request.getLevel());
        group.setAgeGroup(request.getAgeGroup());
        group.setCapacity(request.getCapacity());
        group.setZone(request.getZone());
        group.setDescription(request.getDescription());
        group.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

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

        // Assign assessment template if provided
        if (request.getAssessmentTemplateId() != null) {
            group.setAssessmentTemplate(requireActiveTemplate(request.getAssessmentTemplateId()));
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

        // Reload this page's groups with their players attached, in one query.
        // Without it every group would come back with an empty player list,
        // which is what the cards and the split picker read.
        List<Long> ids = groups.getContent().stream().map(Group::getId).collect(Collectors.toList());
        if (ids.isEmpty()) {
            return groups.map(GroupResponse::new);
        }

        Map<Long, Group> withPlayers = groupRepository.findAllWithPlayersByIds(ids).stream()
                .collect(Collectors.toMap(Group::getId, group -> group));

        return groups.map(group -> new GroupResponse(withPlayers.getOrDefault(group.getId(), group)));
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

        // Update assessment template if provided. Null means "leave as is";
        // clearing it goes through removeAssessmentTemplate, because dropping
        // it blocks assessments for every player in the group.
        if (request.getAssessmentTemplateId() != null) {
            group.setAssessmentTemplate(requireActiveTemplate(request.getAssessmentTemplateId()));
        }

        group.setUpdatedAt(LocalDateTime.now());
        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    /**
     * Relieve a full group by splitting it in two.
     *
     * The new group is a sibling: same level, age group, age range and
     * assessment, so the players moved across are assessed on exactly what
     * they were before. The coach is deliberately not copied, because one
     * coach usually cannot take both groups, and the card will prompt for one.
     *
     * All of it commits together, so a failure cannot leave a half-populated
     * group behind.
     */
    public GroupSplitResponse splitGroup(Long sourceGroupId, GroupSplitRequest request) {
        Group source = groupRepository.findByIdWithPlayersAndCoach(sourceGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", sourceGroupId));

        Group newGroup = new Group();
        newGroup.setName(request.getNewGroupName().trim());
        newGroup.setLevel(source.getLevel());
        newGroup.setAgeGroup(source.getAgeGroup());
        newGroup.setMinAge(source.getMinAge());
        newGroup.setMaxAge(source.getMaxAge());
        newGroup.setCapacity(source.getCapacity());
        newGroup.setZone(source.getZone());
        newGroup.setAssessmentTemplate(source.getAssessmentTemplate());
        newGroup.setIsActive(true);
        final Group createdGroup = groupRepository.save(newGroup);

        int moved = 0;
        if (request.getPlayerIdsToMove() != null) {
            for (Long playerId : request.getPlayerIdsToMove()) {
                Player player = playerRepository.findById(playerId)
                        .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));

                // Guard against pulling in players from unrelated groups: this
                // operation is about redistributing one group.
                if (player.getGroup() == null || !player.getGroup().getId().equals(sourceGroupId)) {
                    throw new BusinessRuleException(
                            player.getFullName() + " is not in " + source.getName()
                                    + " and cannot be moved by splitting it.");
                }

                // Both sides: currentPlayerCount reads the group's own
                // collection, so setting only the owning side leaves the
                // returned counts stale even after a re-read.
                source.getPlayers().remove(player);
                createdGroup.getPlayers().add(player);
                player.setGroup(createdGroup);
                playerRepository.save(player);
                moved++;
            }
        }

        // The player whose assignment hit the limit, placed wherever the admin
        // chose. No capacity check: splitting is the deliberate response to
        // being over, and the admin has already been told.
        if (request.getNewPlayerId() != null) {
            Player newPlayer = playerRepository.findById(request.getNewPlayerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Player", request.getNewPlayerId()));

            boolean joinsNew = request.getNewPlayerJoinsNewGroup() == null
                    || request.getNewPlayerJoinsNewGroup();
            Group target = joinsNew ? createdGroup : source;

            if (newPlayer.getGroup() != null) {
                newPlayer.getGroup().getPlayers().remove(newPlayer);
            }
            target.getPlayers().add(newPlayer);
            newPlayer.setGroup(target);
            playerRepository.save(newPlayer);
        }

        return new GroupSplitResponse(
                new GroupResponse(source),
                new GroupResponse(createdGroup),
                moved);
    }

    /**
     * Move or unassign several of a group's players at once.
     *
     * One transaction, so a selection either lands entirely or not at all.
     * Capacity is not enforced: the admin picked these players deliberately,
     * and the alternative is a bulk action that half-succeeds.
     *
     * @return the source group, and the destination when there was one
     */
    public GroupSplitResponse movePlayers(Long sourceGroupId, BulkPlayerMoveRequest request) {
        Group source = groupRepository.findByIdWithPlayersAndCoach(sourceGroupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", sourceGroupId));

        Group target = null;
        if (request.getTargetGroupId() != null) {
            if (request.getTargetGroupId().equals(sourceGroupId)) {
                throw new BusinessRuleException("Those players are already in " + source.getName() + ".");
            }
            target = groupRepository.findByIdWithPlayersAndCoach(request.getTargetGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group", request.getTargetGroupId()));
        }

        int moved = 0;
        for (Long playerId : request.getPlayerIds()) {
            Player player = playerRepository.findById(playerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));

            if (player.getGroup() == null || !player.getGroup().getId().equals(sourceGroupId)) {
                throw new BusinessRuleException(
                        player.getFullName() + " is not in " + source.getName() + ".");
            }

            // Both sides, so the counts returned here are correct without a
            // re-read: currentPlayerCount reads the group's own collection.
            source.getPlayers().remove(player);
            if (target != null) {
                target.getPlayers().add(player);
            }
            player.setGroup(target);
            playerRepository.save(player);
            moved++;
        }

        return new GroupSplitResponse(
                new GroupResponse(source),
                target != null ? new GroupResponse(target) : null,
                moved);
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

    /**
     * Unassign the group's assessment template.
     *
     * Separate from updateGroup because a null id there means "leave it alone",
     * and because removing it blocks assessments for everyone in the group.
     */
    public GroupResponse removeAssessmentTemplateFromGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", groupId));

        group.setAssessmentTemplate(null);
        group.setUpdatedAt(LocalDateTime.now());

        Group savedGroup = groupRepository.save(group);
        return new GroupResponse(savedGroup);
    }

    /** A template must exist and be active before a group can point at it. */
    private AssessmentTemplate requireActiveTemplate(Long templateId) {
        AssessmentTemplate template = assessmentTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment template", templateId));

        if (!Boolean.TRUE.equals(template.getIsActive())) {
            throw new BusinessRuleException(
                    "Assessment template \"" + template.getTitle() + "\" is inactive and cannot be assigned.");
        }
        return template;
    }

    // Get available groups (with capacity)
    public List<GroupResponse> getAvailableGroups() {
        List<Group> groups = groupRepository.findAvailableGroups();
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
        int playerAge = calculatePlayerAge(player.getDateOfBirth());
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
        return AgeUtils.calculateAge(dateOfBirth);
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