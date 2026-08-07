package com.batal.service;

import com.batal.dto.CreatePlayersRequest;
import com.batal.dto.CreatePlayersResponse;
import com.batal.dto.GroupCreateRequest;
import com.batal.dto.PlayerDTO;
import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.entity.Player;
import com.batal.entity.Group;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Gender;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.PlayerRepository;
import com.batal.repository.GroupRepository;
import com.batal.repository.UserRepository;
import com.batal.entity.User;
import com.batal.entity.enums.UserType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    /**
     * Create one or more players under a single main parent.
     *
     * Everything happens in one transaction, so a failure on the third child
     * cannot leave behind a parent account with two children and a setup email
     * already on its way. The setup email itself is published as an after
     * commit event, so it only goes out if the whole request succeeded.
     */
    public CreatePlayersResponse createPlayersWithParent(CreatePlayersRequest request) {
        User parent;
        boolean parentCreated = false;

        if (request.getParentId() != null) {
            parent = userRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent", request.getParentId()));
            if (parent.getUserType() != UserType.PARENT) {
                throw new BusinessRuleException(
                        "User with id " + request.getParentId() + " is not a parent");
            }
        } else {
            CreatePlayersRequest.NewParent details = request.getNewParent();
            UserCreateRequest parentRequest = new UserCreateRequest();
            parentRequest.setFirstName(details.getFirstName());
            parentRequest.setLastName(details.getLastName());
            parentRequest.setEmail(details.getEmail());
            parentRequest.setPhone(details.getPhone());
            parentRequest.setAddress(details.getAddress());
            parentRequest.setSecondaryParentName(details.getSecondaryParentName());
            parentRequest.setSecondaryParentEmail(details.getSecondaryParentEmail());
            parentRequest.setSecondaryParentPhone(details.getSecondaryParentPhone());
            parentRequest.setUserType(UserType.PARENT);

            // Throws ResourceAlreadyExistsException on a duplicate email, which
            // rolls the whole request back before any player is written.
            UserResponse created = userService.createUser(parentRequest);
            parent = userRepository.findById(created.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent", created.getId()));
            parentCreated = true;
        }

        List<PlayerDTO> createdPlayers = new ArrayList<>();
        for (PlayerDTO player : request.getPlayers()) {
            player.setParentId(parent.getId());
            createdPlayers.add(createPlayer(player, request.isAutoAssignGroup()));
        }

        return new CreatePlayersResponse(
                createdPlayers,
                userService.getUserById(parent.getId()),
                parentCreated);
    }

    /**
     * Create a new player with automatic group assignment if no group specified
     */
    public PlayerDTO createPlayer(PlayerDTO playerDTO) {
        return createPlayer(playerDTO, true);
    }

    /**
     * Create a new player with option for automatic group assignment
     */
    public PlayerDTO createPlayer(PlayerDTO playerDTO, boolean autoAssignGroup) {
        // Create Player entity directly (no User needed - players don't authenticate)
        Player player = new Player();
        player.setFirstName(playerDTO.getFirstName());
        player.setLastName(playerDTO.getLastName());
        player.setDateOfBirth(playerDTO.getDateOfBirth());
        player.setGender(playerDTO.getGender());
        player.setAddress(playerDTO.getAddress());
        player.setJoiningDate(playerDTO.getJoiningDate() != null ? playerDTO.getJoiningDate() : LocalDate.now());
        player.setLevel(playerDTO.getLevel());
        player.setBasicFoot(playerDTO.getBasicFoot());
        player.setEmergencyContactName(playerDTO.getEmergencyContactName());
        player.setEmergencyContactPhone(playerDTO.getEmergencyContactPhone());
        player.setIsActive(true);

        // Set player-specific fields
        player.setPlayerNumber(playerDTO.getPlayerNumber());
        player.setPosition(playerDTO.getPosition());

        // Set parent if provided
        if (playerDTO.getParentId() != null) {
            User parent = userRepository.findById(playerDTO.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent not found with id: " + playerDTO.getParentId()));

            // Validate parent is actually a PARENT user type
            if (parent.getUserType() != UserType.PARENT) {
                throw new RuntimeException("User with id " + playerDTO.getParentId() + " is not a parent");
            }

            player.addParent(parent);
        }


        // Set group if provided, otherwise auto-assign if enabled
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            player.setGroup(group);
        } else if (autoAssignGroup && player.getDateOfBirth() != null && player.getLevel() != null) {
            try {
                Player savedPlayer = playerRepository.save(player);
                autoAssignPlayerToGroup(savedPlayer);
                return convertToDTO(savedPlayer);
            } catch (Exception e) {
                // If auto-assignment fails, we still keep the player but log the issue
                System.out.println("Warning: Could not auto-assign player to group: " + e.getMessage());
            }
        }

        Player savedPlayer = playerRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Get all players with pagination and search
     */
    @Transactional(readOnly = true)
    public Page<PlayerDTO> getAllPlayers(Pageable pageable, String search) {
        Page<Player> players;
        if (search != null && !search.trim().isEmpty()) {
            players = playerRepository.findAllWithGroupAndSearch(search.trim(), pageable);
        } else {
            players = playerRepository.findAllWithGroup(pageable);
        }
        return players.map(this::convertToDTO);
    }
    
    /**
     * Get all players with pagination (legacy method for backward compatibility)
     */
    @Transactional(readOnly = true)
    public Page<PlayerDTO> getAllPlayers(Pageable pageable) {
        return getAllPlayers(pageable, null);
    }

    /**
     * Get all active players
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getActivePlayers() {
        List<Player> players = playerRepository.findAllActive();
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get player by ID
     */
    @Transactional(readOnly = true)
    public Optional<PlayerDTO> getPlayerById(Long id) {
        Optional<Player> player = playerRepository.findByIdWithGroup(id);
        return player.map(this::convertToDTO);
    }

    /**
     * Update player
     */
    public PlayerDTO updatePlayer(Long id, PlayerDTO playerDTO) {
        Player existingPlayer = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        // Update fields
        updatePlayerFields(existingPlayer, playerDTO);

        // Update group if provided
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            existingPlayer.setGroup(group);
        } else {
            existingPlayer.setGroup(null);
        }

        Player updatedPlayer = playerRepository.save(existingPlayer);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Deactivate player (soft delete)
     */
    public PlayerDTO deactivatePlayer(Long id, String reason) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        player.setIsActive(false);
        player.setInactiveReason(reason);

        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Reactivate player
     */
    public PlayerDTO reactivatePlayer(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        player.setIsActive(true);
        player.setInactiveReason(null);

        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Delete player (hard delete)
     * This will remove the player from groups and delete the record
     */
    public void deletePlayer(Long id) {
        Player player = playerRepository.findByIdWithGroup(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        // Remove player from their group if assigned
        if (player.getGroup() != null) {
            Group group = player.getGroup();
            group.getPlayers().remove(player);
            groupRepository.save(group);
        }

        // Delete the player record
        playerRepository.delete(player);
    }

    /**
     * Search players by name
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> searchPlayersByName(String searchTerm) {
        List<Player> players = playerRepository.searchByName(searchTerm);
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get players by group
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getPlayersByGroup(Long groupId) {
        List<Player> players = playerRepository.findByGroupIdWithGroup(groupId);
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get players without assigned group
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getUnassignedPlayers() {
        List<Player> players = playerRepository.findUnassignedActivePlayers();
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Auto-assign player to appropriate group based on age and level
     */
    public PlayerDTO autoAssignPlayerToGroup(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        autoAssignPlayerToGroup(player);
        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Internal method to auto-assign player to group
     */
    private void autoAssignPlayerToGroup(Player player) {
        if (player.getDateOfBirth() == null || player.getLevel() == null) {
            throw new RuntimeException("Player must have date of birth and level to be auto-assigned");
        }

        // Calculate player age
        int playerAge = LocalDate.now().getYear() - player.getDateOfBirth().getYear();
        AgeGroup ageGroup = AgeGroup.getByAge(playerAge);

        if (ageGroup == null) {
            throw new RuntimeException("Player age (" + playerAge + ") is not within supported age range (4-16 years)");
        }

        // Find available group with matching level and age group
        List<Group> availableGroups = groupRepository.findAvailableGroupsByLevelAndAgeGroup(
                player.getLevel(), ageGroup);

        if (availableGroups.isEmpty()) {
            // Create new group if none available
            createNewGroupForPlayer(player, ageGroup);
        } else {
            // Assign to first available group
            Group targetGroup = availableGroups.get(0);
            player.setGroup(targetGroup);
        }
    }

    /**
     * Create a new group for the player when no available groups exist
     */
    private void createNewGroupForPlayer(Player player, AgeGroup ageGroup) {
        // Find next group number for this level and age group
        List<Group> existingGroups = groupRepository.findByLevelAndAgeGroup(player.getLevel(), ageGroup);
        int nextGroupNumber = existingGroups.size() + 1;

        // Create new group
        Group newGroup = new Group();
        newGroup.setLevel(player.getLevel());
        newGroup.setAgeGroup(ageGroup);
        newGroup.setCapacity(15); // Default capacity
        newGroup.setMinAge(ageGroup.getMinAge());
        newGroup.setMaxAge(ageGroup.getMaxAge());
        newGroup.setIsActive(true);

        // Generate group name
        String suffix = nextGroupNumber > 1 ? " " + nextGroupNumber : "";
        newGroup.setName(player.getLevel().getDisplayName() + " " +
                ageGroup.getDisplayName() + suffix);

        Group savedGroup = groupRepository.save(newGroup);
        player.setGroup(savedGroup);
    }

    /**
     * Promote player to advanced level and reassign to appropriate group
     */
    public PlayerDTO promotePlayerToAdvanced(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (player.getLevel() == com.batal.entity.enums.Level.ADVANCED) {
            throw new RuntimeException("Player is already at Advanced level");
        }

        // Update level
        player.setLevel(com.batal.entity.enums.Level.ADVANCED);
        player.setUpdatedAt(LocalDateTime.now());

        // Remove from current group
        if (player.getGroup() != null) {
            player.setGroup(null);
        }

        // Auto-assign to new Advanced group
        autoAssignPlayerToGroup(player);

        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Convert Player entity to PlayerDTO
     */
    private PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());

        // Get data directly from Player entity
        dto.setFirstName(player.getFirstName());
        dto.setLastName(player.getLastName());
        dto.setDateOfBirth(player.getDateOfBirth());
        dto.setGender(player.getGender());
        dto.setAddress(player.getAddress());
        dto.setJoiningDate(player.getJoiningDate());
        dto.setLevel(player.getLevel());
        dto.setBasicFoot(player.getBasicFoot());
        dto.setEmergencyContactName(player.getEmergencyContactName());
        dto.setEmergencyContactPhone(player.getEmergencyContactPhone());
        dto.setIsActive(player.getIsActive());
        dto.setInactiveReason(player.getInactiveReason());

        // Set player-specific fields
        dto.setPlayerNumber(player.getPlayerNumber());
        dto.setPosition(player.getPosition());

        // Set group information
        if (player.getGroup() != null) {
            dto.setGroupId(player.getGroup().getId());
            dto.setGroupName(player.getGroup().getName());
        }

        // Set parent information (from many-to-many relationship)
        if (player.hasParents()) {
            List<User> parentList = player.getParents().stream()
                    .sorted(Comparator.comparing(User::getId))
                    .toList();
            User mainParent = parentList.get(0);
            dto.setParentId(mainParent.getId());
            dto.setParentName(mainParent.getFullName());

            // Read-only, and owned by the parent account.
            dto.setSecondaryParentName(mainParent.getSecondaryParentName());
            dto.setSecondaryParentEmail(mainParent.getSecondaryParentEmail());
            dto.setSecondaryParentPhone(mainParent.getSecondaryParentPhone());
        }

        dto.setCreatedAt(player.getCreatedAt());
        dto.setUpdatedAt(player.getUpdatedAt());

        return dto;
    }

    /**
     * Convert PlayerDTO to Player entity
     */
    private Player convertToEntity(PlayerDTO dto) {
        Player player = new Player();
        // Note: Personal data will be set in the User entity via createUserForPlayer() or updatePlayerFields()
        // Player entity only contains player-specific fields which are not in the DTO currently
        return player;
    }

    /**
     * Update player fields from DTO
     */
    private void updatePlayerFields(Player player, PlayerDTO dto) {
        // Update all fields directly on Player entity
        player.setFirstName(dto.getFirstName());
        player.setLastName(dto.getLastName());
        player.setDateOfBirth(dto.getDateOfBirth());
        player.setGender(dto.getGender());
        player.setAddress(dto.getAddress());
        player.setJoiningDate(dto.getJoiningDate());
        player.setLevel(dto.getLevel());
        player.setBasicFoot(dto.getBasicFoot());
        player.setEmergencyContactName(dto.getEmergencyContactName());
        player.setEmergencyContactPhone(dto.getEmergencyContactPhone());

        // Update player-specific fields
        player.setPlayerNumber(dto.getPlayerNumber());
        player.setPosition(dto.getPosition());

        // Update parent relationships
        player.getParents().clear();
        if (dto.getParentId() != null) {
            User parent = userRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent not found with id: " + dto.getParentId()));

            if (parent.getUserType() != UserType.PARENT) {
                throw new RuntimeException("User with id " + dto.getParentId() + " is not a parent");
            }

            player.addParent(parent);
        }

        if (dto.getIsActive() != null) {
            player.setIsActive(dto.getIsActive());
        }
        if (dto.getInactiveReason() != null) {
            player.setInactiveReason(dto.getInactiveReason());
        }

        player.setUpdatedAt(LocalDateTime.now());
    }


}
