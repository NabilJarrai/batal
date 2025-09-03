package com.batal.service;

import com.batal.dto.PlayerDTO;
import com.batal.entity.Player;
import com.batal.entity.Group;
import com.batal.repository.PlayerRepository;
import com.batal.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    
    /**
     * Create a new player
     */
    public PlayerDTO createPlayer(PlayerDTO playerDTO) {
        // Check if email already exists
        if (playerRepository.existsByEmail(playerDTO.getEmail())) {
            throw new RuntimeException("Player with email " + playerDTO.getEmail() + " already exists");
        }
        
        Player player = convertToEntity(playerDTO);
        player.setCreatedAt(LocalDateTime.now());
        player.setUpdatedAt(LocalDateTime.now());
        
        // Set group if provided
        if (playerDTO.getGroupId() != null) {
            Group group = groupRepository.findById(playerDTO.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + playerDTO.getGroupId()));
            player.setGroup(group);
        }
        
        Player savedPlayer = playerRepository.save(player);
        return convertToDTO(savedPlayer);
    }
    
    /**
     * Get all players with pagination
     */
    @Transactional(readOnly = true)
    public Page<PlayerDTO> getAllPlayers(Pageable pageable) {
        Page<Player> players = playerRepository.findAllWithGroup(pageable);
        return players.map(this::convertToDTO);
    }
    
    /**
     * Get all active players
     */
    @Transactional(readOnly = true)
    public List<PlayerDTO> getActivePlayers() {
        List<Player> players = playerRepository.findByIsActiveTrue();
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
        if (!existingPlayer.getEmail().equals(playerDTO.getEmail()) && 
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
        
        player.setIsActive(true);
        player.setInactiveReason(null);
        player.setUpdatedAt(LocalDateTime.now());
        
        Player updatedPlayer = playerRepository.save(player);
        return convertToDTO(updatedPlayer);
    }
    
    /**
     * Delete player (hard delete)
     */
    public void deletePlayer(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new RuntimeException("Player not found with id: " + id);
        }
        playerRepository.deleteById(id);
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
     * Convert Player entity to PlayerDTO
     */
    private PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setFirstName(player.getFirstName());
        dto.setLastName(player.getLastName());
        dto.setEmail(player.getEmail());
        dto.setPhone(player.getPhone());
        dto.setDateOfBirth(player.getDateOfBirth());
        dto.setGender(player.getGender());
        dto.setAddress(player.getAddress());
        dto.setParentName(player.getParentName());
        dto.setJoiningDate(player.getJoiningDate());
        dto.setLevel(player.getLevel());
        dto.setBasicFoot(player.getBasicFoot());
        dto.setEmergencyContactName(player.getEmergencyContactName());
        dto.setEmergencyContactPhone(player.getEmergencyContactPhone());
        dto.setIsActive(player.getIsActive());
        dto.setInactiveReason(player.getInactiveReason());
        dto.setCreatedAt(player.getCreatedAt());
        dto.setUpdatedAt(player.getUpdatedAt());
        
        // Set group information
        if (player.getGroup() != null) {
            dto.setGroupId(player.getGroup().getId());
            dto.setGroupName(player.getGroup().getName());
        }
        
        return dto;
    }
    
    /**
     * Convert PlayerDTO to Player entity
     */
    private Player convertToEntity(PlayerDTO dto) {
        Player player = new Player();
        player.setFirstName(dto.getFirstName());
        player.setLastName(dto.getLastName());
        player.setEmail(dto.getEmail());
        player.setPhone(dto.getPhone());
        player.setDateOfBirth(dto.getDateOfBirth());
        player.setGender(dto.getGender());
        player.setAddress(dto.getAddress());
        player.setParentName(dto.getParentName());
        player.setJoiningDate(dto.getJoiningDate());
        player.setLevel(dto.getLevel());
        player.setBasicFoot(dto.getBasicFoot());
        player.setEmergencyContactName(dto.getEmergencyContactName());
        player.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        player.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        player.setInactiveReason(dto.getInactiveReason());
        
        return player;
    }
    
    /**
     * Update player fields from DTO
     */
    private void updatePlayerFields(Player player, PlayerDTO dto) {
        player.setFirstName(dto.getFirstName());
        player.setLastName(dto.getLastName());
        player.setEmail(dto.getEmail());
        player.setPhone(dto.getPhone());
        player.setDateOfBirth(dto.getDateOfBirth());
        player.setGender(dto.getGender());
        player.setAddress(dto.getAddress());
        player.setParentName(dto.getParentName());
        player.setJoiningDate(dto.getJoiningDate());
        player.setLevel(dto.getLevel());
        player.setBasicFoot(dto.getBasicFoot());
        player.setEmergencyContactName(dto.getEmergencyContactName());
        player.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        
        if (dto.getIsActive() != null) {
            player.setIsActive(dto.getIsActive());
        }
        if (dto.getInactiveReason() != null) {
            player.setInactiveReason(dto.getInactiveReason());
        }
    }
}
