package com.batal.controller;

import com.batal.dto.AssessmentResponse;
import com.batal.dto.PlayerDTO;
import com.batal.service.UserDetailsServiceImpl;
import com.batal.service.ParentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for parent self-service operations
 * Allows parents to view their children's data
 */
@RestController
@RequestMapping("/parents/me")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('PARENT')")
public class ParentSelfController {

    @Autowired
    private ParentService parentService;

    /**
     * Get all my children
     * GET /api/parents/me/children
     */
    @GetMapping("/children")
    public ResponseEntity<List<PlayerDTO>> getMyChildren(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<PlayerDTO> children = parentService.getMyChildren(userId);
        return ResponseEntity.ok(children);
    }

    /**
     * Get specific child details
     * GET /api/parents/me/children/{playerId}
     */
    @GetMapping("/children/{playerId}")
    public ResponseEntity<PlayerDTO> getChild(
            @PathVariable Long playerId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        PlayerDTO child = parentService.getChild(userId, playerId);
        return ResponseEntity.ok(child);
    }

    /**
     * Get all assessments for a child
     * GET /api/parents/me/children/{playerId}/assessments
     */
    @GetMapping("/children/{playerId}/assessments")
    public ResponseEntity<List<AssessmentResponse>> getChildAssessments(
            @PathVariable Long playerId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<AssessmentResponse> assessments = parentService.getChildAssessments(userId, playerId);
        return ResponseEntity.ok(assessments);
    }

    /**
     * Get specific assessment for a child
     * GET /api/parents/me/children/{playerId}/assessments/{assessmentId}
     */
    @GetMapping("/children/{playerId}/assessments/{assessmentId}")
    public ResponseEntity<AssessmentResponse> getChildAssessment(
            @PathVariable Long playerId,
            @PathVariable Long assessmentId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        AssessmentResponse assessment = parentService.getChildAssessment(userId, playerId, assessmentId);
        return ResponseEntity.ok(assessment);
    }

    /**
     * Extract user ID from authentication principal
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        UserDetailsServiceImpl.UserPrincipal userPrincipal =
                (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
        return userPrincipal.getId();
    }
}
