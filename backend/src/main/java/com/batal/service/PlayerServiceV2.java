package com.batal.service;

import com.batal.dto.PlayerDTO;
import com.batal.entity.User;
import com.batal.entity.Group;
import com.batal.entity.Role;
import com.batal.entity.enums.UserType;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.AgeGroup;
import com.batal.repository.UserRepository;
import com.batal.repository.GroupRepository;
import com.batal.repository.RoleRepository;
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

@Service("playerServiceV2")
@Transactional
public class PlayerServiceV2 {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${batal.player-default-password:player123}")
    private String playerDefaultPassword;

    /**
     * Create a new player (User with PLAYER type)
     */
    public PlayerDTO createPlayer(PlayerDTO playerDTO) {
        return createPlayer(playerDTO, true);
    }

    /**
     * Create a new player with option for automatic group assignment
     */
    public PlayerDTO createPlayer(PlayerDTO playerDTO, boolean autoAssignGroup) {
        // Check if user with this email already exists
        if (userRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("User with email " + playerDTO.getEmail() + " already exists");
        }

        User player = convertToUserEntity(playerDTO);
        player.setUserType(UserType.PLAYER);
        player.setPassword(passwordEncoder.encode(playerDefaultPassword));
        player.setCreatedAt(LocalDateTime.now());
        player.setUpdatedAt(LocalDateTime.now());

        // Set group if provided, otherwise auto-assign if enabled
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            player.setGroup(group);
        }

        // Save player first
        User savedPlayer = userRepository.save(player);

        // Assign PLAYER role
        Optional<Role> playerRole = roleRepository.findByName("PLAYER");
        if (playerRole.isPresent()) {
            savedPlayer.getRoles().add(playerRole.get());
            userRepository.save(savedPlayer);
        }

        // Auto-assign to group if enabled and no group specified
        if (autoAssignGroup && playerDTO.getGroupId() == null && 
            player.getDateOfBirth() != null && player.getLevel() != null) {
            try {
                autoAssignPlayerToGroup(savedPlayer);
            } catch (Exception e) {
                System.out.println("Warning: Could not auto-assign player to group: " + e.getMessage());
            }
        }

        return convertToDTO(savedPlayer);
    }

    /**
     * Get all players with pagination and search
     */
    @Transactional(readOnly = true)
    public Page<PlayerDTO> getAllPlayers(Pageable pageable, String search) {
        Page<User> players;
        if (search != null && !search.trim().isEmpty()) {
            players = userRepository.findByUserTypeAndFullNameContainingIgnoreCase(
                UserType.PLAYER, search.trim(), pageable);
        } else {
            players = userRepository.findByUserType(UserType.PLAYER, pageable);
        }
        return players.map(this::convertToDTO);
    }

    /**
     * Get all players with pagination (legacy method)
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
        List<User> players = userRepository.findByUserTypeAndIsActiveTrue(UserType.PLAYER);
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get player by ID
     */
    @Transactional(readOnly = true)
    public Optional<PlayerDTO> getPlayerById(Long id) {
        Optional<User> player = userRepository.findPlayerByIdWithGroup(id);
        return player.map(this::convertToDTO);
    }

    /**
     * Get player by email
     */
    @Transactional(readOnly = true)
    public Optional<PlayerDTO> getPlayerByEmail(String email) {
        Optional<User> player = userRepository.findByEmail(email);
        if (player.isPresent() && UserType.PLAYER.equals(player.get().getUserType())) {
            return Optional.of(convertToDTO(player.get()));
        }
        return Optional.empty();
    }

    /**
     * Update player information
     */
    public PlayerDTO updatePlayer(Long playerId, PlayerDTO playerDTO) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        // Check email uniqueness if changed
        if (!player.getEmail().equals(playerDTO.getEmail()) && 
            userRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + playerDTO.getEmail());
        }

        updateUserFromDTO(player, playerDTO);
        player.setUpdatedAt(LocalDateTime.now());

        User savedPlayer = userRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Deactivate a player
     */
    public PlayerDTO deactivatePlayer(Long playerId, String reason) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        player.setIsActive(false);
        player.setInactiveReason(reason);
        player.setUpdatedAt(LocalDateTime.now());

        User savedPlayer = userRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Reactivate a player
     */
    public PlayerDTO reactivatePlayer(Long playerId) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        player.setIsActive(true);
        player.setInactiveReason(null);
        player.setUpdatedAt(LocalDateTime.now());

        User savedPlayer = userRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Delete a player
     */
    public void deletePlayer(Long playerId) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        userRepository.delete(player);
    }

    /**
     * Get players by group
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getPlayersByGroup(Long groupId) {
        List<User> players = userRepository.findByGroupIdAndUserType(groupId, UserType.PLAYER);
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Search players by name
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> searchPlayersByName(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getActivePlayers();
        }

        Page<User> players = userRepository.findByUserTypeAndFullNameContainingIgnoreCase(
            UserType.PLAYER, searchTerm.trim(), Pageable.unpaged());
        
        return players.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unassigned players (players without groups)
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getUnassignedPlayers() {
        List<User> players = userRepository.findUnassignedPlayers();
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Auto-assign player to appropriate group based on age and level
     */
    public PlayerDTO autoAssignPlayerToGroup(Long playerId) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        autoAssignPlayerToGroup(player);
        User savedPlayer = userRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Promote player to advanced level
     */
    public PlayerDTO promotePlayerToAdvanced(Long playerId) {
        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found with id: " + playerId));

        if (!UserType.PLAYER.equals(player.getUserType())) {
            throw new RuntimeException("User is not a player");
        }

        if (Level.ADVANCED.equals(player.getLevel())) {
            throw new RuntimeException("Player is already at advanced level");
        }

        player.setLevel(Level.ADVANCED);
        player.setUpdatedAt(LocalDateTime.now());

        // Try to reassign to advanced group
        try {
            autoAssignPlayerToGroup(player);
        } catch (Exception e) {
            System.out.println("Warning: Could not reassign player to advanced group: " + e.getMessage());
        }

        User savedPlayer = userRepository.save(player);
        return convertToDTO(savedPlayer);
    }

    /**
     * Get player statistics
     */
    @Transactional(readOnly = true)
    public PlayerStatsDTO getPlayerStats() {
        long totalPlayers = userRepository.countActivePlayers();
        long unassignedPlayers = userRepository.countUnassignedPlayers();
        
        return new PlayerStatsDTO(totalPlayers, unassignedPlayers);
    }

    // ===== PRIVATE HELPER METHODS =====

    private void autoAssignPlayerToGroup(User player) {
        if (player.getDateOfBirth() == null || player.getLevel() == null) {
            throw new RuntimeException("Cannot auto-assign: Date of birth and level are required");
        }

        int age = LocalDate.now().getYear() - player.getDateOfBirth().getYear();
        AgeGroup ageGroup = AgeGroup.getByAge(age);

        if (ageGroup == null) {
            throw new RuntimeException("No suitable age group found for age: " + age);
        }

        // Find suitable group
        Optional<Group> suitableGroup = groupRepository.findByLevelAndAgeGroup(player.getLevel(), ageGroup)
                .stream()
                .filter(group -> {
                    long currentPlayers = userRepository.countPlayersByGroup(group.getId());
                    return currentPlayers < group.getCapacity();
                })
                .findFirst();

        if (suitableGroup.isPresent()) {
            player.setGroup(suitableGroup.get());
        } else {
            throw new RuntimeException("No available group found for " + ageGroup + " " + player.getLevel());
        }
    }

    private User convertToUserEntity(PlayerDTO dto) {
        User user = new User();
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setGender(dto.getGender() != null ? 
            User.Gender.valueOf(dto.getGender().name()) : null);
        user.setAddress(dto.getAddress());
        user.setParentName(dto.getParentName());
        user.setJoiningDate(dto.getJoiningDate() != null ? dto.getJoiningDate() : LocalDate.now());
        user.setLevel(dto.getLevel());
        user.setBasicFoot(dto.getBasicFoot());
        user.setEmergencyContactName(dto.getEmergencyContactName());
        user.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        user.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        user.setInactiveReason(dto.getInactiveReason());
        
        return user;
    }

    private void updateUserFromDTO(User user, PlayerDTO dto) {
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setGender(dto.getGender() != null ? 
            User.Gender.valueOf(dto.getGender().name()) : null);
        user.setAddress(dto.getAddress());
        user.setParentName(dto.getParentName());
        user.setJoiningDate(dto.getJoiningDate());
        user.setLevel(dto.getLevel());
        user.setBasicFoot(dto.getBasicFoot());
        user.setEmergencyContactName(dto.getEmergencyContactName());
        user.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        user.setInactiveReason(dto.getInactiveReason());
        
        // Update group if specified
        if (dto.getGroupId() != null) {
            Group group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + dto.getGroupId()));
            user.setGroup(group);
        }
    }

    private PlayerDTO convertToDTO(User user) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setGender(user.getGender() != null ? 
            com.batal.entity.enums.Gender.valueOf(user.getGender().name()) : null);
        dto.setAddress(user.getAddress());
        dto.setParentName(user.getParentName());
        dto.setJoiningDate(user.getJoiningDate());
        dto.setLevel(user.getLevel());
        dto.setBasicFoot(user.getBasicFoot());
        dto.setEmergencyContactName(user.getEmergencyContactName());
        dto.setEmergencyContactPhone(user.getEmergencyContactPhone());
        dto.setIsActive(user.getIsActive());
        dto.setInactiveReason(user.getInactiveReason());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        
        if (user.getGroup() != null) {
            dto.setGroupId(user.getGroup().getId());
            dto.setGroupName(user.getGroup().getName());
        }
        
        return dto;
    }

    // ===== INNER CLASSES =====
    
    public static class PlayerStatsDTO {
        private final long totalPlayers;
        private final long unassignedPlayers;
        
        public PlayerStatsDTO(long totalPlayers, long unassignedPlayers) {
            this.totalPlayers = totalPlayers;
            this.unassignedPlayers = unassignedPlayers;
        }
        
        public long getTotalPlayers() { return totalPlayers; }
        public long getUnassignedPlayers() { return unassignedPlayers; }
        public long getAssignedPlayers() { return totalPlayers - unassignedPlayers; }
    }
}