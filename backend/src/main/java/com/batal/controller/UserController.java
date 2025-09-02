package com.batal.controller;

import com.batal.dto.UserResponse;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmailWithRoles(email);
        if (userOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.badRequest().body(error);
        }
        
        User user = userOpt.get();
        List<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        
        UserResponse userResponse = new UserResponse(user, roleNames);
        return ResponseEntity.ok(userResponse);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or @userController.isCurrentUser(#id)")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.badRequest().body(error);
        }

        User user = userOpt.get();
        List<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());

        UserResponse userResponse = new UserResponse(user, roleNames);
        return ResponseEntity.ok(userResponse);
    }    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        List<UserResponse> userResponses = users.stream()
                .map(user -> {
                    List<String> roleNames = user.getRoles().stream()
                            .map(role -> role.getName())
                            .collect(Collectors.toList());
                    return new UserResponse(user, roleNames);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userResponses);
    }
    
    // Helper method for security expression
    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && userOpt.get().getId().equals(userId);
    }
}
