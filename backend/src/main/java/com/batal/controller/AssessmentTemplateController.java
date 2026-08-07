package com.batal.controller;

import com.batal.dto.AssessmentTemplateRequest;
import com.batal.dto.AssessmentTemplateResponse;
import com.batal.service.AssessmentTemplateService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Assessment templates: the named sets of skills assigned to groups.
 */
@RestController
@RequestMapping("/assessment-templates")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AssessmentTemplateController {

    @Autowired
    private AssessmentTemplateService templateService;

    /**
     * Coaches need this to score, so any authenticated user may read templates.
     * activeOnly=true is what the group assignment picker wants.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AssessmentTemplateResponse>> getAllTemplates(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(templateService.getAllTemplates(activeOnly));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssessmentTemplateResponse> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getTemplateById(id));
    }

    /**
     * The template a player will be assessed against, inherited from their
     * group. This is what the assessment form loads its skills from.
     */
    @GetMapping("/for-player/{playerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssessmentTemplateResponse> getTemplateForPlayer(@PathVariable Long playerId) {
        return ResponseEntity.ok(templateService.getTemplateForPlayer(playerId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<AssessmentTemplateResponse> createTemplate(
            @Valid @RequestBody AssessmentTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(templateService.createTemplate(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<AssessmentTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody AssessmentTemplateRequest request) {
        return ResponseEntity.ok(templateService.updateTemplate(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("message", "Assessment template deleted successfully"));
    }
}
