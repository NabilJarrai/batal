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
    public ResponseEntity<?> getAllUsers() {
        try {
            List<UserResponse> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching users: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // GET /api/users/{id} - Get user by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @userController.isCurrentUser(#id)")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // POST /api/users - Create new user (Admin only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserCreateRequest request) {
        try {
            UserResponse createdUser = userService.createUser(request);
            return ResponseEntity.ok(createdUser);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // PUT /api/users/{id} - Update user
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @userController.isCurrentUser(#id)")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        try {
            UserResponse updatedUser = userService.updateUser(id, request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // DELETE /api/users/{id} - Delete user (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // PATCH /api/users/{id}/status - Toggle user active/inactive (Admin only)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest request) {
        try {
            UserResponse updatedUser = userService.updateUserStatus(id, request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // GET /api/users/me - Get current user profile
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.badRequest().body(error);
            }
            
            UserResponse userResponse = userService.getUserById(userOpt.get().getId());
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // PUT /api/users/me - Update current user profile
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateCurrentUserProfile(@Valid @RequestBody UserUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
            if (userOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.badRequest().body(error);
            }
            
            UserResponse updatedUser = userService.updateUser(userOpt.get().getId(), request);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Helper method for security expression
    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && userOpt.get().getId().equals(userId);
    }
}
