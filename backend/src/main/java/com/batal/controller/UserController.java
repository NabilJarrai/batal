package com.batal.controller;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
import com.batal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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
    
    // GET /api/users - List all users (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
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
    
    // GET /api/users/coaches - Get all coaches
    @GetMapping("/coaches")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllCoaches() {
        List<UserResponse> coaches = userService.getUsersByRole("COACH");
        return ResponseEntity.ok(coaches);
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

    // Helper method for security expression
    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && userOpt.get().getId().equals(userId);
    }
}
