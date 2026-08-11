package com.batal.controller;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.dto.ChildSummaryDTO;
import com.batal.dto.AssignChildRequest;
import com.batal.dto.AdminPasswordResetRequest;
import com.batal.dto.BulkWelcomeEmailRequest;
import com.batal.dto.BulkWelcomeEmailResponse;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
import com.batal.service.UserService;
import com.batal.service.ParentBulkEmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParentBulkEmailService parentBulkEmailService;

    // GET /api/users - List all staff users (Admin only) with pagination and search
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserResponse> users = userService.getAllStaffUsers(pageable, search);
        return ResponseEntity.ok(users);
    }
    
    // GET /api/users/{id} - Get user by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @userController.isCurrentUser(#id)")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    
    // POST /api/users - Create new user (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        UserResponse createdUser = userService.createUser(request);
        return ResponseEntity.ok(createdUser);
    }
    
    // PUT /api/users/{id} - Update user
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @userController.isCurrentUser(#id)")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        UserResponse updatedUser = userService.updateUser(id, request);
        return ResponseEntity.ok(updatedUser);
    }
    
    // DELETE /api/users/{id} - Delete user (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    // PATCH /api/users/{id}/status - Toggle user active/inactive (Admin only)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserStatus(@PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest request) {
        UserResponse updatedUser = userService.updateUserStatus(id, request);
        return ResponseEntity.ok(updatedUser);
    }
    
    // GET /api/users/me - Get current user profile
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
        if (userOpt.isEmpty()) {
            throw new com.batal.exception.ResourceNotFoundException("User", "email", email);
        }
        
        UserResponse userResponse = userService.getUserById(userOpt.get().getId());
        return ResponseEntity.ok(userResponse);
    }
    
    // PUT /api/users/me - Update current user profile
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateCurrentUserProfile(@Valid @RequestBody UserUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
        if (userOpt.isEmpty()) {
            throw new com.batal.exception.ResourceNotFoundException("User", "email", email);
        }
        
        UserResponse updatedUser = userService.updateUser(userOpt.get().getId(), request);
        return ResponseEntity.ok(updatedUser);
    }
    
    // GET /api/users/coaches/available - Get available coaches (coaches without full group load)
    @GetMapping("/coaches/available") 
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> getAvailableCoaches() {
        // For now, return all active coaches - could be enhanced with workload logic
        List<UserResponse> coaches = userService.getUsersByRole("COACH");
        List<UserResponse> availableCoaches = coaches.stream()
            .filter(coach -> coach.getIsActive())
            .toList();
        return ResponseEntity.ok(availableCoaches);
    }

    // GET /api/users/parents/search - Search parent users
    @GetMapping("/parents/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> searchParents(
            @RequestParam(required = false) String query) {
        List<UserResponse> parents = userService.searchParentUsers(query);
        return ResponseEntity.ok(parents);
    }

    // GET /api/users/parents - Paginated parents for the Parents tab.
    // Kept apart from GET /api/users, which now returns academy staff only.
    @GetMapping("/parents")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Page<UserResponse>> getAllParents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "firstName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            // Deactivated families are hidden unless explicitly asked for.
            @RequestParam(defaultValue = "false") boolean includeInactive) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
            Sort.by(sortBy).descending() :
            Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserResponse> parents = userService.getAllParentUsers(pageable, search, includeInactive);
        return ResponseEntity.ok(parents);
    }

    // GET /api/users/parents/deactivated-count - How many parents the default
    // active-only view is hiding, so the Parents tab can offer to show them.
    @GetMapping("/parents/deactivated-count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Map<String, Long>> getDeactivatedParentCount() {
        Map<String, Long> response = new HashMap<>();
        response.put("count", userService.countDeactivatedParents());
        return ResponseEntity.ok(response);
    }

    // POST /api/users/parents/welcome-emails - Send the welcome (password setup)
    // email to a chosen set of parents. This is how an intake created while
    // welcome emails were paused finally gets invited.
    @PostMapping("/parents/welcome-emails")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkWelcomeEmailResponse> sendParentWelcomeEmails(
            @Valid @RequestBody BulkWelcomeEmailRequest request) {
        BulkWelcomeEmailResponse response = parentBulkEmailService.sendWelcomeEmails(request.getUserIds());
        return ResponseEntity.ok(response);
    }

    // POST /api/users/parents/password-resets - Send a password reset link to a
    // chosen set of parents. For parents who already onboarded and are locked
    // out; those who never set a password are skipped and need the welcome
    // email instead.
    @PostMapping("/parents/password-resets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BulkWelcomeEmailResponse> sendParentPasswordResets(
            @Valid @RequestBody BulkWelcomeEmailRequest request) {
        BulkWelcomeEmailResponse response = parentBulkEmailService.sendPasswordResets(request.getUserIds());
        return ResponseEntity.ok(response);
    }

    // GET /api/users/parents/awaiting-welcome-email - Every parent who has an
    // account but has never been sent their setup link. Backs the "waiting to
    // be invited" count and the select-all action.
    @GetMapping("/parents/awaiting-welcome-email")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getParentsAwaitingWelcomeEmail() {
        List<Long> ids = parentBulkEmailService.findIdsAwaitingWelcomeEmail();
        Map<String, Object> response = new HashMap<>();
        response.put("count", ids.size());
        response.put("userIds", ids);
        return ResponseEntity.ok(response);
    }

    // POST /api/users/{id}/reset-password - Admin sets a user's password directly
    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> resetUserPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminPasswordResetRequest request) {
        UserResponse updatedUser = userService.resetUserPassword(id, request);
        return ResponseEntity.ok(updatedUser);
    }

    // ========== PARENT-CHILD MANAGEMENT ENDPOINTS ==========

    // POST /api/users/{parentId}/children - Assign a child to a parent
    @PostMapping("/{parentId}/children")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserResponse> assignChildToParent(
            @PathVariable Long parentId,
            @Valid @RequestBody AssignChildRequest request) {
        UserResponse updatedParent = userService.assignChildToParent(parentId, request.getPlayerId());
        return ResponseEntity.ok(updatedParent);
    }

    // DELETE /api/users/{parentId}/children/{playerId} - Unassign a child from a parent
    @DeleteMapping("/{parentId}/children/{playerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserResponse> unassignChildFromParent(
            @PathVariable Long parentId,
            @PathVariable Long playerId) {
        UserResponse updatedParent = userService.unassignChildFromParent(parentId, playerId);
        return ResponseEntity.ok(updatedParent);
    }

    // Helper method for security expression
    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && userOpt.get().getId().equals(userId);
    }
}
