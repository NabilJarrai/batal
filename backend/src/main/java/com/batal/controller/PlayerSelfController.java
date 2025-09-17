package com.batal.controller;

import com.batal.dto.PlayerDTO;
import com.batal.dto.AssessmentDTO;
import com.batal.dto.PasswordChangeRequest;
import com.batal.entity.Player;
import com.batal.entity.Assessment;
import com.batal.entity.User;
import com.batal.entity.enums.Gender;
import com.batal.repository.PlayerRepository;
import com.batal.repository.AssessmentRepository;
import com.batal.service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/players/me")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('PLAYER')")
public class PlayerSelfController {
    
    @Autowired
    private PlayerService playerService;
    
    @Autowired
    private PlayerRepository playerRepository;
    
    @Autowired
    private AssessmentRepository assessmentRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Get current player's own profile
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyProfile() {
        try {
            Player player = getCurrentPlayer();
            PlayerDTO playerDTO = convertToPlayerDTO(player);
            return ResponseEntity.ok(playerDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Unable to fetch profile", "message", e.getMessage()));
        }
    }
    
    /**
     * Update current player's own profile (limited fields)
     */
    @PutMapping
    public ResponseEntity<?> updateMyProfile(@Valid @RequestBody PlayerDTO playerDTO) {
        try {
            Player player = getCurrentPlayer();
            
            // Only allow updating certain fields - these now exist on the User entity
            player.getUser().setPhone(playerDTO.getPhone());
            player.getUser().setAddress(playerDTO.getAddress());
            player.getUser().setEmergencyContactName(playerDTO.getEmergencyContactName());
            player.getUser().setEmergencyContactPhone(playerDTO.getEmergencyContactPhone());
            
            // Update user record as well
            if (player.getUser() != null) {
                User user = player.getUser();
                user.setPhone(playerDTO.getPhone());
                user.setAddress(playerDTO.getAddress());
                user.setEmergencyContactName(playerDTO.getEmergencyContactName());
                user.setEmergencyContactPhone(playerDTO.getEmergencyContactPhone());
            }
            
            Player updatedPlayer = playerRepository.save(player);
            PlayerDTO updatedDTO = convertToPlayerDTO(updatedPlayer);
            
            return ResponseEntity.ok(updatedDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update profile", "message", e.getMessage()));
        }
    }
    
    /**
     * Change current player's password
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        try {
            Player player = getCurrentPlayer();
            
            if (player.getUser() == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User account not found"));
            }
            
            User user = player.getUser();
            
            // Verify current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
            }
            
            // Update password
            playerService.changePlayerPassword(player.getId(), request.getNewPassword());
            
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to change password", "message", e.getMessage()));
        }
    }
    
    /**
     * Get all assessments for current player
     */
    @GetMapping("/assessments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyAssessments() {
        try {
            Player player = getCurrentPlayer();
            List<Assessment> assessments = assessmentRepository.findByPlayerIdWithAllRelationsOrderByAssessmentDateDesc(player.getId());
            List<AssessmentDTO> assessmentDTOs = assessments.stream()
                .map(this::convertToAssessmentDTO)
                .collect(Collectors.toList());

            return ResponseEntity.ok(assessmentDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch assessments", "message", e.getMessage()));
        }
    }
    
    /**
     * Get specific assessment details for current player
     */
    @GetMapping("/assessments/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyAssessmentById(@PathVariable Long id) {
        try {
            Player player = getCurrentPlayer();
            Optional<Assessment> assessment = assessmentRepository.findByIdWithAllRelations(id);

            if (assessment.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Verify the assessment belongs to the current player
            if (!assessment.get().getPlayer().getId().equals(player.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Access denied to this assessment"));
            }

            AssessmentDTO assessmentDTO = convertToAssessmentDTO(assessment.get());
            return ResponseEntity.ok(assessmentDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch assessment", "message", e.getMessage()));
        }
    }
    
    /**
     * Helper method to get current authenticated player
     */
    private Player getCurrentPlayer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        return playerRepository.findByEmailWithGroup(email)
            .orElseThrow(() -> new RuntimeException("Player not found for email: " + email));
    }
    
    /**
     * Convert Player entity to PlayerDTO
     */
    private PlayerDTO convertToPlayerDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());

        // Use Player's utility methods that handle null checks
        dto.setFirstName(player.getFirstName());
        dto.setLastName(player.getLastName());
        dto.setEmail(player.getEmail());

        // Access user data safely with null checks
        if (player.getUser() != null) {
            User user = player.getUser();
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

            if (user.getGroup() != null) {
                dto.setGroupId(user.getGroup().getId());
                dto.setGroupName(user.getGroup().getName());
            }
        }

        return dto;
    }
    
    /**
     * Convert Assessment entity to AssessmentDTO
     */
    private AssessmentDTO convertToAssessmentDTO(Assessment assessment) {
        AssessmentDTO dto = new AssessmentDTO();
        dto.setId(assessment.getId());
        dto.setPlayerId(assessment.getPlayer().getId());
        dto.setPlayerName(assessment.getPlayer().getFullName());
        dto.setAssessorId(assessment.getAssessor().getId());
        dto.setAssessorName(assessment.getAssessor().getFullName());
        dto.setAssessmentDate(assessment.getAssessmentDate());
        dto.setPeriod(assessment.getPeriod());
        dto.setComments(assessment.getComments());
        dto.setCoachNotes(assessment.getCoachNotes());
        dto.setIsFinalized(assessment.getIsFinalized());
        dto.setCreatedAt(assessment.getCreatedAt());
        dto.setUpdatedAt(assessment.getUpdatedAt());
        
        // Add skill scores
        if (assessment.getSkillScores() != null) {
            dto.setSkillScores(assessment.getSkillScores().stream()
                .map(score -> {
                    Map<String, Object> skillMap = new HashMap<>();
                    skillMap.put("skillId", score.getSkill().getId());
                    skillMap.put("skillName", score.getSkill().getName());
                    skillMap.put("skillCategory", score.getSkill().getCategory().toString());
                    skillMap.put("score", score.getScore());
                    skillMap.put("notes", score.getNotes() != null ? score.getNotes() : "");
                    return skillMap;
                })
                .collect(Collectors.toList()));
        }
        
        return dto;
    }
}