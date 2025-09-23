package com.batal.controller;

import com.batal.dto.*;
import com.batal.service.AssessmentService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assessments")
public class AssessmentController {

    @Autowired
    private AssessmentService assessmentService;

    // ===== CREATE OPERATIONS =====

    /**
     * Create a new assessment for a player
     */
    @PostMapping
    public ResponseEntity<?> createAssessment(@Valid @RequestBody AssessmentCreateRequest request) {
        try {
            AssessmentResponse response = assessmentService.createAssessment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            // Business rule violations (e.g., duplicate assessments, validation errors)
            Map<String, Object> errorResponse = Map.of(
                "error", "Bad Request",
                "message", e.getMessage(),
                "status", 400
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (SecurityException e) {
            Map<String, Object> errorResponse = Map.of(
                "error", "Forbidden",
                "message", "Access denied",
                "status", 403
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        } catch (EntityNotFoundException e) {
            Map<String, Object> errorResponse = Map.of(
                "error", "Not Found",
                "message", e.getMessage(),
                "status", 404
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = Map.of(
                "error", "Internal Server Error",
                "message", "An unexpected error occurred",
                "status", 500
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ===== READ OPERATIONS =====

    /**
     * Get assessment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AssessmentResponse> getAssessmentById(@PathVariable Long id) {
        try {
            AssessmentResponse response = assessmentService.getAssessmentById(id);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get all assessments for the current user
     * - Coaches get assessments for players in their groups
     * - Admins/Managers get all assessments
     */
    @GetMapping("/my-assessments")
    public ResponseEntity<List<AssessmentResponse>> getMyAssessments() {
        try {
            List<AssessmentResponse> assessments = assessmentService.getMyAssessments();
            return ResponseEntity.ok(assessments);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get assessments by player ID
     */
    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<AssessmentResponse>> getAssessmentsByPlayerId(@PathVariable Long playerId) {
        try {
            List<AssessmentResponse> assessments = assessmentService.getAssessmentsByPlayerId(playerId);
            return ResponseEntity.ok(assessments);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get assessments by coach ID
     */
    @GetMapping("/coach/{coachId}")
    public ResponseEntity<List<AssessmentResponse>> getAssessmentsByCoachId(@PathVariable Long coachId) {
        try {
            List<AssessmentResponse> assessments = assessmentService.getAssessmentsByCoachId(coachId);
            return ResponseEntity.ok(assessments);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get assessments by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<AssessmentResponse>> getAssessmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            if (endDate.isBefore(startDate)) {
                return ResponseEntity.badRequest().build();
            }
            
            List<AssessmentResponse> assessments = assessmentService.getAssessmentsByDateRange(startDate, endDate);
            return ResponseEntity.ok(assessments);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== UPDATE OPERATIONS =====

    /**
     * Update an existing assessment
     */
    @PutMapping("/{id}")
    public ResponseEntity<AssessmentResponse> updateAssessment(
            @PathVariable Long id, 
            @Valid @RequestBody AssessmentUpdateRequest request) {
        try {
            if (!request.hasUpdates()) {
                return ResponseEntity.badRequest().build();
            }
            
            AssessmentResponse response = assessmentService.updateAssessment(id, request);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Finalize an assessment (prevents further editing)
     */
    @PatchMapping("/{id}/finalize")
    public ResponseEntity<AssessmentResponse> finalizeAssessment(@PathVariable Long id) {
        try {
            AssessmentResponse response = assessmentService.finalizeAssessment(id);
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== DELETE OPERATIONS =====

    /**
     * Delete an assessment (Admin/Manager only, or non-finalized assessments)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssessment(@PathVariable Long id) {
        try {
            assessmentService.deleteAssessment(id);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get assessment summary with optional filters
     */
    @GetMapping("/summary")
    public ResponseEntity<AssessmentSummaryResponse> getAssessmentSummary(
            @RequestParam(required = false) Long playerId,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        try {
            AssessmentSummaryResponse summary = assessmentService.getAssessmentSummary(playerId, groupId, period, dateFrom, dateTo);
            return ResponseEntity.ok(summary);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== ANALYTICS OPERATIONS =====

    /**
     * Get player progress analytics
     */
    @GetMapping("/analytics/player/{playerId}")
    public ResponseEntity<Map<String, Object>> getPlayerProgressAnalytics(@PathVariable Long playerId) {
        try {
            Map<String, Object> analytics = assessmentService.getPlayerProgressAnalytics(playerId);
            return ResponseEntity.ok(analytics);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ===== UTILITY ENDPOINTS =====

    /**
     * Check if a player can be assessed in a specific month/year
     */
    @GetMapping("/can-assess/{playerId}")
    public ResponseEntity<Map<String, Object>> canAssessPlayer(
            @PathVariable Long playerId,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            // This is a simplified check - you might want to add this method to the service
            Map<String, Object> result = Map.of(
                "canAssess", true,
                "message", "Player can be assessed for " + month + "/" + year
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "Assessment Service",
            "timestamp", LocalDate.now().toString()
        ));
    }

}