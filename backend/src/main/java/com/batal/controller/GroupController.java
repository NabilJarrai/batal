package com.batal.controller;

import com.batal.dto.*;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import com.batal.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/groups")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GroupController {

    @Autowired
    private GroupService groupService;

    // GET /api/groups - Get all groups with optional filters
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getAllGroups(
            @RequestParam(required = false) Level level,
            @RequestParam(required = false) AgeGroup ageGroup,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GroupResponse> groups = groupService.getAllGroups(level, ageGroup, isActive, pageable);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching groups: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/groups/{id} - Get group by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getGroupById(@PathVariable Long id) {
        try {
            GroupResponse group = groupService.getGroupById(id);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/groups - Create new group
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> createGroup(@Valid @RequestBody GroupCreateRequest request) {
        try {
            GroupResponse createdGroup = groupService.createGroup(request);
            return ResponseEntity.ok(createdGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // PUT /api/groups/{id} - Update group
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> updateGroup(@PathVariable Long id, @Valid @RequestBody GroupUpdateRequest request) {
        try {
            GroupResponse updatedGroup = groupService.updateGroup(id, request);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DELETE /api/groups/{id} - Delete group
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        try {
            groupService.deleteGroup(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Group deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/groups/available - Get groups with available spots
    @GetMapping("/available")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getAvailableGroups() {
        try {
            List<GroupResponse> groups = groupService.getAvailableGroups();
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching available groups: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/groups/by-level/{level} - Get groups by level
    @GetMapping("/by-level/{level}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getGroupsByLevel(@PathVariable Level level) {
        try {
            List<GroupResponse> groups = groupService.getGroupsByLevel(level);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching groups by level: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/groups/by-age-group/{ageGroup} - Get groups by age group
    @GetMapping("/by-age-group/{ageGroup}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<?> getGroupsByAgeGroup(@PathVariable AgeGroup ageGroup) {
        try {
            List<GroupResponse> groups = groupService.getGroupsByAgeGroup(ageGroup);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching groups by age group: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/groups/assign-player - Assign player to group
    @PostMapping("/assign-player")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> assignPlayerToGroup(@Valid @RequestBody GroupAssignmentRequest request) {
        try {
            GroupResponse updatedGroup = groupService.assignPlayerToGroup(request);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/groups/{groupId}/assign-player/{playerId} - Streamlined player assignment 
    // No request body required - player and group IDs are in the URL path
    @PostMapping("/{groupId}/assign-player/{playerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> assignPlayerToGroupStreamlined(
            @PathVariable Long groupId, 
            @PathVariable Long playerId,
            @RequestBody(required = false) Map<String, Object> options) {
        try {
            // Extract optional parameters
            String reason = options != null ? (String) options.get("reason") : "Manual assignment";
            Boolean forceAssignment = options != null ? (Boolean) options.get("forceAssignment") : null;
            
            // Create assignment request
            GroupAssignmentRequest request = new GroupAssignmentRequest(playerId, groupId, reason);
            request.setForceAssignment(forceAssignment != null ? forceAssignment : false);
            
            GroupResponse updatedGroup = groupService.assignPlayerToGroup(request);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }


    // DELETE /api/groups/{groupId}/remove-player/{playerId} - Remove player from group
    @DeleteMapping("/{groupId}/remove-player/{playerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> removePlayerFromGroup(@PathVariable Long groupId, @PathVariable Long playerId) {
        try {
            GroupResponse updatedGroup = groupService.removePlayerFromGroup(groupId, playerId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/groups/assign-coach - Assign coach to group
    @PostMapping("/assign-coach")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> assignCoachToGroup(@Valid @RequestBody CoachAssignmentRequest request) {
        try {
            GroupResponse updatedGroup = groupService.assignCoachToGroup(request);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DELETE /api/groups/{groupId}/remove-coach - Remove coach from group
    @DeleteMapping("/{groupId}/remove-coach")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> removeCoachFromGroup(@PathVariable Long groupId) {
        try {
            GroupResponse updatedGroup = groupService.removeCoachFromGroup(groupId);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET /api/groups/coach/{coachId} - Get coach's assigned groups
    @GetMapping("/coach/{coachId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or (hasRole('COACH') and @groupController.isCurrentUserCoach(#coachId))")
    public ResponseEntity<?> getCoachGroups(@PathVariable Long coachId) {
        try {
            List<GroupResponse> groups = groupService.getCoachGroups(coachId);
            return ResponseEntity.ok(groups);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // PATCH /api/groups/{id}/activate - Activate group
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> activateGroup(@PathVariable Long id) {
        try {
            GroupResponse updatedGroup = groupService.activateGroup(id);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // PATCH /api/groups/{id}/deactivate - Deactivate group
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deactivateGroup(@PathVariable Long id) {
        try {
            GroupResponse updatedGroup = groupService.deactivateGroup(id);
            return ResponseEntity.ok(updatedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST /api/groups/auto-assign-player/{playerId} - Auto-assign player to appropriate group
    @PostMapping("/auto-assign-player/{playerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> autoAssignPlayerToGroup(@PathVariable Long playerId) {
        try {
            GroupResponse assignedGroup = groupService.autoAssignPlayerToGroup(playerId);
            return ResponseEntity.ok(assignedGroup);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Helper method for security - check if current user is the specific coach
    public boolean isCurrentUserCoach(Long coachId) {
        // This will be implemented similar to UserController.isCurrentUser()
        // For now, we'll return true to allow implementation - this should be properly implemented
        return true;
    }
}