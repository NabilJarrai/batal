package com.batal.service;

import com.batal.dto.AssessmentResponse;
import com.batal.dto.PlayerDTO;
import com.batal.entity.Assessment;
import com.batal.entity.Player;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.AssessmentRepository;
import com.batal.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for parent operations - viewing their children's data
 */
@Service
@Transactional
public class ParentService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    /**
     * Get all children for a parent
     *
     * @param parentUserId The parent's user ID
     * @return List of children as PlayerDTO
     */
    public List<PlayerDTO> getMyChildren(Long parentUserId) {
        List<Player> children = playerRepository.findByParentIdWithGroup(parentUserId);
        return children.stream()
                .map(this::convertToPlayerDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get specific child details (with security check)
     *
     * @param parentUserId The parent's user ID
     * @param playerId The child's player ID
     * @return Child details as PlayerDTO
     * @throws ResourceNotFoundException if child not found or access denied
     */
    public PlayerDTO getChild(Long parentUserId, Long playerId) {
        Player player = playerRepository.findByIdAndParentIdWithGroup(playerId, parentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Player not found or you don't have permission to access this player"));
        return convertToPlayerDTO(player);
    }

    /**
     * Get all assessments for a child
     *
     * @param parentUserId The parent's user ID
     * @param playerId The child's player ID
     * @return List of assessments for the child
     * @throws ResourceNotFoundException if child not found or access denied
     */
    public List<AssessmentResponse> getChildAssessments(Long parentUserId, Long playerId) {
        // Security check: verify parent owns this child
        playerRepository.findByIdAndParentId(playerId, parentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Access denied - this player is not your child"));

        // Fetch assessments
        List<Assessment> assessments = assessmentRepository
                .findByPlayerIdWithAllRelationsOrderByAssessmentDateDesc(playerId);

        return assessments.stream()
                .map(this::convertToAssessmentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get specific assessment for a child
     *
     * @param parentUserId The parent's user ID
     * @param playerId The child's player ID
     * @param assessmentId The assessment ID
     * @return Assessment details
     * @throws ResourceNotFoundException if child or assessment not found or access denied
     */
    public AssessmentResponse getChildAssessment(Long parentUserId, Long playerId, Long assessmentId) {
        // Security check: verify parent owns this child
        playerRepository.findByIdAndParentId(playerId, parentUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Access denied - this player is not your child"));

        // Fetch assessment
        Assessment assessment = assessmentRepository.findByIdWithAllRelations(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", assessmentId));

        // Verify assessment belongs to this player
        if (!assessment.getPlayer().getId().equals(playerId)) {
            throw new ResourceNotFoundException(
                    "This assessment does not belong to the specified player");
        }

        return convertToAssessmentResponse(assessment);
    }

    // ========== CONVERSION METHODS ==========

    /**
     * Convert Player entity to PlayerDTO
     */
    private PlayerDTO convertToPlayerDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setFirstName(player.getFirstName());
        dto.setLastName(player.getLastName());
        dto.setEmail(player.getEmail());
        dto.setPhone(player.getPhone());
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

        // Group info
        if (player.getGroup() != null) {
            dto.setGroupId(player.getGroup().getId());
            dto.setGroupName(player.getGroup().getName());
        }

        // Player-specific fields
        dto.setPlayerNumber(player.getPlayerNumber());
        dto.setPosition(player.getPosition());

        return dto;
    }

    /**
     * Convert Assessment entity to AssessmentResponse
     */
    private AssessmentResponse convertToAssessmentResponse(Assessment assessment) {
        AssessmentResponse response = new AssessmentResponse();
        response.setId(assessment.getId());
        response.setPlayerId(assessment.getPlayer().getId());
        response.setPlayerName(assessment.getPlayer().getFullName());
        response.setAssessorId(assessment.getAssessor().getId());
        response.setAssessorName(assessment.getAssessor().getFullName());
        response.setAssessmentDate(assessment.getAssessmentDate());
        response.setPeriod(assessment.getPeriod());
        response.setComments(assessment.getComments());
        response.setCoachNotes(assessment.getCoachNotes());
        response.setIsFinalized(assessment.getIsFinalized());
        response.setCreatedAt(assessment.getCreatedAt());
        response.setUpdatedAt(assessment.getUpdatedAt());

        // Convert skill scores
        if (assessment.getSkillScores() != null && !assessment.getSkillScores().isEmpty()) {
            List<AssessmentResponse.SkillScoreResponse> skillScoreResponses = assessment.getSkillScores().stream()
                    .map(skillScore -> new AssessmentResponse.SkillScoreResponse(
                            skillScore.getId(),
                            skillScore.getSkill().getId(),
                            skillScore.getSkill().getName(),
                            skillScore.getSkill().getCategory(),
                            skillScore.getScore(),
                            skillScore.getNotes(),
                            null, // previousScore not available in this context
                            null  // improvement not available in this context
                    ))
                    .collect(Collectors.toList());
            response.setSkillScores(skillScoreResponses);
        }

        // Calculate overall average
        response.setOverallAverage(assessment.getAverageScore());

        return response;
    }
}
