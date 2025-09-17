package com.batal.service;

import com.batal.dto.GroupCreateRequest;
import com.batal.dto.PlayerDTO;
import com.batal.entity.Player;
import com.batal.entity.Group;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Gender;
import com.batal.repository.PlayerRepository;
import com.batal.repository.GroupRepository;
import com.batal.repository.UserRepository;
import com.batal.repository.RoleRepository;
import com.batal.entity.User;
import com.batal.entity.Role;
import com.batal.entity.enums.UserType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${batal.player-default-password}")
    private String playerDefaultPassword;

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
        // Check if email already exists
        if (playerRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("Player with email " + playerDTO.getEmail() + " already exists");
        }

        // Check if user with this email already exists
        if (userRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("User with email " + playerDTO.getEmail() + " already exists");
        }

        // Create user account for the player (trigger will automatically create Player record)
        User user = createUserForPlayer(playerDTO);
        
        // Retrieve the automatically created Player record
        Player player = playerRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Player record was not automatically created for user: " + user.getId()));
        
        // Update the player with any additional fields from DTO
        player.setUpdatedAt(LocalDateTime.now());

        // Set group if provided, otherwise auto-assign if enabled
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            user.setGroup(group);
            userRepository.save(user); // Save user with group assignment
        } else if (autoAssignGroup && user.getDateOfBirth() != null && user.getLevel() != null) {
            try {
                autoAssignPlayerToGroup(player);
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
     * Get player by email
     */
    @Transactional(readOnly = true)
    public Optional<PlayerDTO> getPlayerByEmail(String email) {
        Optional<Player> player = playerRepository.findByEmailWithGroup(email);
        return player.map(this::convertToDTO);
    }

    /**
     * Update player
     */
    public PlayerDTO updatePlayer(Long id, PlayerDTO playerDTO) {
        Player existingPlayer = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        // Check if email is being changed and if new email already exists
        if (!existingPlayer.getUser().getEmail().equals(playerDTO.getEmail()) &&
                playerRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("Player with email " + playerDTO.getEmail() + " already exists");
        }

        // Update fields
        updatePlayerFields(existingPlayer, playerDTO);
        existingPlayer.setUpdatedAt(LocalDateTime.now());

        // Update group if provided
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            existingPlayer.getUser().setGroup(group);
        } else {
            existingPlayer.getUser().setGroup(null);
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

        player.getUser().setIsActive(false);
        player.getUser().setInactiveReason(reason);
        player.setUpdatedAt(LocalDateTime.now());

        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Reactivate player
     */
    public PlayerDTO reactivatePlayer(Long id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));

        player.getUser().setIsActive(true);
        player.getUser().setInactiveReason(null);
        player.setUpdatedAt(LocalDateTime.now());

        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }

    /**
     * Delete player (hard delete)
     * This will also delete the associated user account and remove from groups
     */
    public void deletePlayer(Long id) {
        Player player = playerRepository.findByIdWithGroup(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + id));
        
        // Remove player from their group if assigned
        if (player.getUser().getGroup() != null) {
            Group group = player.getUser().getGroup();
            group.getPlayers().remove(player.getUser());
            groupRepository.save(group);
        }
        
        // Delete the associated user account if exists
        if (player.getUser() != null) {
            User userToDelete = player.getUser();
            playerRepository.delete(player); // Delete player first
            userRepository.delete(userToDelete); // Then delete user
        } else {
            playerRepository.delete(player);
        }
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
        if (player.getUser().getDateOfBirth() == null || player.getUser().getLevel() == null) {
            throw new RuntimeException("Player must have date of birth and level to be auto-assigned");
        }

        // Calculate player age
        int playerAge = LocalDate.now().getYear() - player.getUser().getDateOfBirth().getYear();
        AgeGroup ageGroup = AgeGroup.getByAge(playerAge);

        if (ageGroup == null) {
            throw new RuntimeException("Player age (" + playerAge + ") is not within supported age range (4-16 years)");
        }

        // Find available group with matching level and age group
        List<Group> availableGroups = groupRepository.findAvailableGroupsByLevelAndAgeGroup(
                player.getUser().getLevel(), ageGroup);

        if (availableGroups.isEmpty()) {
            // Create new group if none available
            createNewGroupForPlayer(player, ageGroup);
        } else {
            // Assign to first available group
            Group targetGroup = availableGroups.get(0);
            player.getUser().setGroup(targetGroup);
        }
    }

    /**
     * Create a new group for the player when no available groups exist
     */
    private void createNewGroupForPlayer(Player player, AgeGroup ageGroup) {
        // Find next group number for this level and age group
        List<Group> existingGroups = groupRepository.findByLevelAndAgeGroup(player.getUser().getLevel(), ageGroup);
        int nextGroupNumber = existingGroups.size() + 1;

        // Create new group
        Group newGroup = new Group();
        newGroup.setLevel(player.getUser().getLevel());
        newGroup.setAgeGroup(ageGroup);
        newGroup.setCapacity(15); // Default capacity
        newGroup.setMinAge(ageGroup.getMinAge());
        newGroup.setMaxAge(ageGroup.getMaxAge());
        newGroup.setIsActive(true);

        // Generate group name
        String suffix = nextGroupNumber > 1 ? " " + nextGroupNumber : "";
        newGroup.setName(player.getUser().getLevel().getDisplayName() + " " +
                ageGroup.getDisplayName() + suffix);

        Group savedGroup = groupRepository.save(newGroup);
        player.getUser().setGroup(savedGroup);
    }

    /**
     * Promote player to advanced level and reassign to appropriate group
     */
    public PlayerDTO promotePlayerToAdvanced(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (player.getUser().getLevel() == com.batal.entity.enums.Level.ADVANCED) {
            throw new RuntimeException("Player is already at Advanced level");
        }

        // Update level
        player.getUser().setLevel(com.batal.entity.enums.Level.ADVANCED);
        player.setUpdatedAt(LocalDateTime.now());

        // Remove from current group
        if (player.getUser().getGroup() != null) {
            player.getUser().setGroup(null);
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
        
        // Get data from User entity
        User user = player.getUser();
        if (user != null) {
            dto.setFirstName(user.getFirstName());
            dto.setLastName(user.getLastName());
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            dto.setDateOfBirth(user.getDateOfBirth());
            dto.setGender(user.getGender() != null ? Gender.valueOf(user.getGender().toString()) : null);
            dto.setAddress(user.getAddress());
            dto.setParentName(user.getParentName());
            dto.setJoiningDate(user.getJoiningDate());
            dto.setLevel(user.getLevel());
            dto.setBasicFoot(user.getBasicFoot());
            dto.setEmergencyContactName(user.getEmergencyContactName());
            dto.setEmergencyContactPhone(user.getEmergencyContactPhone());
            dto.setIsActive(user.getIsActive());
            dto.setInactiveReason(user.getInactiveReason());
            
            // Set group information
            if (user.getGroup() != null) {
                dto.setGroupId(user.getGroup().getId());
                dto.setGroupName(user.getGroup().getName());
            }
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
        // Update user account - all personal data is now in the User entity
        if (player.getUser() != null) {
            User user = player.getUser();
            user.setFirstName(dto.getFirstName());
            user.setLastName(dto.getLastName());
            user.setEmail(dto.getEmail());
            user.setPhone(dto.getPhone());
            user.setDateOfBirth(dto.getDateOfBirth());
            user.setGender(dto.getGender() != null ? User.Gender.valueOf(dto.getGender().toString()) : null);
            user.setAddress(dto.getAddress());
            user.setParentName(dto.getParentName());
            user.setJoiningDate(dto.getJoiningDate());
            user.setLevel(dto.getLevel());
            user.setBasicFoot(dto.getBasicFoot());
            user.setEmergencyContactName(dto.getEmergencyContactName());
            user.setEmergencyContactPhone(dto.getEmergencyContactPhone());
            
            if (dto.getIsActive() != null) {
                user.setIsActive(dto.getIsActive());
            }
            if (dto.getInactiveReason() != null) {
                user.setInactiveReason(dto.getInactiveReason());
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Create a user account for a player
     */
    private User createUserForPlayer(PlayerDTO playerDTO) {
        User user = new User();
        user.setEmail(playerDTO.getEmail());
        // Generate a default password - should be changed on first login
        user.setPassword(passwordEncoder.encode(playerDefaultPassword));
        user.setFirstName(playerDTO.getFirstName());
        user.setLastName(playerDTO.getLastName());
        user.setPhone(playerDTO.getPhone());
        user.setDateOfBirth(playerDTO.getDateOfBirth());
        user.setGender(playerDTO.getGender() != null ? User.Gender.valueOf(playerDTO.getGender().toString()) : null);
        user.setAddress(playerDTO.getAddress());
        user.setParentName(playerDTO.getParentName());
        user.setJoiningDate(playerDTO.getJoiningDate() != null ? playerDTO.getJoiningDate() : LocalDate.now());
        user.setUserType(UserType.PLAYER);
        user.setLevel(playerDTO.getLevel());
        user.setBasicFoot(playerDTO.getBasicFoot());
        user.setEmergencyContactName(playerDTO.getEmergencyContactName());
        user.setEmergencyContactPhone(playerDTO.getEmergencyContactPhone());
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Save user first
        User savedUser = userRepository.save(user);

        // Assign PLAYER role
        Role playerRole = roleRepository.findByName("PLAYER")
                .orElseThrow(() -> new RuntimeException("PLAYER role not found. Please run database migrations."));
        savedUser.getRoles().add(playerRole);

        return userRepository.save(savedUser);
    }

    /**
     * Change player password
     */
    public void changePlayerPassword(Long playerId, String newPassword) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (player.getUser() == null) {
            throw new RuntimeException("Player does not have a user account");
        }

        User user = player.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
