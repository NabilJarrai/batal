package com.batal.controller;

import com.batal.dto.PlayerDTO;
import com.batal.service.PlayerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/players")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PlayerController {
    
    @Autowired
    private PlayerService playerService;
    
    /**
     * Create a new player
     * Only ADMIN and MANAGER can create players
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> createPlayer(@Valid @RequestBody PlayerDTO playerDTO) {
        try {
            PlayerDTO createdPlayer = playerService.createPlayer(playerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPlayer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to create player", "message", e.getMessage()));
        }
    }
    
    /**
     * Get all players with pagination
     * All authenticated users can view players
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<Page<PlayerDTO>> getAllPlayers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PlayerDTO> players = playerService.getAllPlayers(pageable);
        
        return ResponseEntity.ok(players);
    }
    
    /**
     * Get all active players
     * All authenticated users can view active players
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<List<PlayerDTO>> getActivePlayers() {
        List<PlayerDTO> players = playerService.getActivePlayers();
        return ResponseEntity.ok(players);
    }
    
    /**
     * Get player by ID
     * All authenticated users can view player details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getPlayerById(@PathVariable Long id) {
        Optional<PlayerDTO> player = playerService.getPlayerById(id);
        
        if (player.isPresent()) {
            return ResponseEntity.ok(player.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get player by email
     * All authenticated users can search by email
     */
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getPlayerByEmail(@PathVariable String email) {
        Optional<PlayerDTO> player = playerService.getPlayerByEmail(email);
        
        if (player.isPresent()) {
            return ResponseEntity.ok(player.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Update player
     * Only ADMIN and MANAGER can update players
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> updatePlayer(@PathVariable Long id, @Valid @RequestBody PlayerDTO playerDTO) {
        try {
            PlayerDTO updatedPlayer = playerService.updatePlayer(id, playerDTO);
            return ResponseEntity.ok(updatedPlayer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update player", "message", e.getMessage()));
        }
    }
    
    /**
     * Deactivate player (soft delete)
     * Only ADMIN and MANAGER can deactivate players
     */
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deactivatePlayer(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "No reason provided");
            PlayerDTO deactivatedPlayer = playerService.deactivatePlayer(id, reason);
            return ResponseEntity.ok(deactivatedPlayer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to deactivate player", "message", e.getMessage()));
        }
    }
    
    /**
     * Reactivate player
     * Only ADMIN and MANAGER can reactivate players
     */
    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> reactivatePlayer(@PathVariable Long id) {
        try {
            PlayerDTO reactivatedPlayer = playerService.reactivatePlayer(id);
            return ResponseEntity.ok(reactivatedPlayer);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to reactivate player", "message", e.getMessage()));
        }
    }
    
    /**
     * Delete player (hard delete)
     * Only ADMIN can permanently delete players
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePlayer(@PathVariable Long id) {
        try {
            playerService.deletePlayer(id);
            return ResponseEntity.ok()
                .body(Map.of("message", "Player deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to delete player", "message", e.getMessage()));
        }
    }
    
    /**
     * Search players by name
     * All authenticated users can search players
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<List<PlayerDTO>> searchPlayers(@RequestParam String q) {
        List<PlayerDTO> players = playerService.searchPlayersByName(q);
        return ResponseEntity.ok(players);
    }
    
    /**
     * Get players by group
     * All authenticated users can view players by group
     */
    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<List<PlayerDTO>> getPlayersByGroup(@PathVariable Long groupId) {
        List<PlayerDTO> players = playerService.getPlayersByGroup(groupId);
        return ResponseEntity.ok(players);
    }
    
    /**
     * Get player statistics
     * All authenticated users can view statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<Map<String, Object>> getPlayerStats() {
        List<PlayerDTO> allPlayers = playerService.getActivePlayers();
        
        long totalActive = allPlayers.size();
        long totalMale = allPlayers.stream()
            .filter(p -> p.getGender() != null && p.getGender().toString().equals("MALE"))
            .count();
        long totalFemale = allPlayers.stream()
            .filter(p -> p.getGender() != null && p.getGender().toString().equals("FEMALE"))
            .count();
        long developmentLevel = allPlayers.stream()
            .filter(p -> p.getLevel() != null && p.getLevel().toString().equals("DEVELOPMENT"))
            .count();
        long advancedLevel = allPlayers.stream()
            .filter(p -> p.getLevel() != null && p.getLevel().toString().equals("ADVANCED"))
            .count();
        
        Map<String, Object> stats = Map.of(
            "totalActivePlayers", totalActive,
            "genderDistribution", Map.of(
                "male", totalMale,
                "female", totalFemale
            ),
            "levelDistribution", Map.of(
                "development", developmentLevel,
                "advanced", advancedLevel
            )
        );
        
        return ResponseEntity.ok(stats);
    }
}
