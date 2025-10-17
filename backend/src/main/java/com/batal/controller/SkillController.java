package com.batal.controller;

import com.batal.dto.SkillCreateRequest;
import com.batal.dto.SkillResponse;
import com.batal.dto.SkillUpdateRequest;
import com.batal.entity.User;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import com.batal.repository.UserRepository;
import com.batal.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/skills")
@CrossOrigin(origins = "*")
public class SkillController {

    @Autowired
    private SkillService skillService;
    
    @Autowired
    private UserRepository userRepository;

    // Admin-only endpoints
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSkill(
            @Valid @RequestBody SkillCreateRequest request,
            Authentication authentication) {
        try {
            Long adminId = getUserIdFromAuth(authentication);
            SkillResponse skill = skillService.createSkill(request, adminId);
            return ResponseEntity.status(HttpStatus.CREATED).body(skill);
        } catch (com.batal.exception.ResourceAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("error", "Duplicate skill", "message", e.getMessage()));
        } catch (com.batal.exception.ValidationException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Failed to create skill", "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody SkillUpdateRequest request,
            Authentication authentication) {
        try {
            Long adminId = getUserIdFromAuth(authentication);
            SkillResponse skill = skillService.updateSkill(id, request, adminId);
            return ResponseEntity.ok(skill);
        } catch (com.batal.exception.ResourceAlreadyExistsException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("error", "Duplicate skill", "message", e.getMessage()));
        } catch (com.batal.exception.ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("error", "Skill not found", "message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Failed to update skill", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteSkill(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Long adminId = getUserIdFromAuth(authentication);
            skillService.deleteSkill(id, adminId);
            return ResponseEntity.ok("Skill deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkCreateSkills(
            @Valid @RequestBody List<SkillCreateRequest> requests,
            Authentication authentication) {
        try {
            Long adminId = getUserIdFromAuth(authentication);
            List<SkillResponse> skills = skillService.bulkCreateSkills(requests, adminId);
            return ResponseEntity.status(HttpStatus.CREATED).body(skills);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "Failed to create skills", "message", e.getMessage()));
        }
    }

    @PostMapping("/initialize-defaults")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> initializeDefaultSkills(Authentication authentication) {
        try {
            Long adminId = getUserIdFromAuth(authentication);
            skillService.initializeDefaultSkills(adminId);
            return ResponseEntity.ok("Default skills initialized successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Public read-only endpoints (accessible to all authenticated users)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllSkills(
            @RequestParam(required = false) SkillCategory category,
            @RequestParam(required = false) Level level,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "displayOrder") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {
        try {
            Sort.Direction direction = sortDirection.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<SkillResponse> skills = skillService.getAllSkillsPaginated(
                category, level, activeOnly, pageable
            );

            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", "Failed to retrieve skills", "message", e.getMessage()));
        }
    }
    
    // Non-paginated endpoint for backward compatibility
    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllSkillsList(
            @RequestParam(required = false) SkillCategory category,
            @RequestParam(required = false) Level level,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        try {
            List<SkillResponse> skills;

            if (category != null && level != null) {
                skills = skillService.getSkillsByCategoryAndLevel(category, level);
            } else if (category != null) {
                skills = skillService.getSkillsByCategory(category);
            } else if (level != null && activeOnly) {
                skills = skillService.getActiveSkillsByLevel(level);
            } else if (level != null) {
                skills = skillService.getSkillsByLevel(level);
            } else if (activeOnly) {
                skills = skillService.getActiveSkills();
            } else {
                skills = skillService.getAllSkills();
            }

            return ResponseEntity.ok(skills);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", "Failed to retrieve skills", "message", e.getMessage()));
        }
    }

    // Utility method to extract user ID from authentication
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
            if (userOpt.isPresent()) {
                return userOpt.get().getId();
            }
        }
        throw new RuntimeException("Unable to determine user ID from authentication");
    }
}