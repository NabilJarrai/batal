package com.batal.controller;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.dto.ChildSummaryDTO;
import com.batal.dto.AssignChildRequest;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
import com.batal.service.UserService;
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
