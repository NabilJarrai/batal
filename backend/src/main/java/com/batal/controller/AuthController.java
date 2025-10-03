package com.batal.controller;

import com.batal.dto.ChangeFirstLoginPasswordRequest;
import com.batal.dto.LoginRequest;
import com.batal.dto.LoginResponse;
import com.batal.dto.RegisterRequest;
import com.batal.dto.UserResponse;
import com.batal.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        UserResponse response = authService.register(registerRequest);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "User registered successfully!");
        result.put("user", response);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/change-first-login-password")
    public ResponseEntity<LoginResponse> changeFirstLoginPassword(
            @Valid @RequestBody ChangeFirstLoginPasswordRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        LoginResponse response = authService.changeFirstLoginPassword(request, userEmail);
        return ResponseEntity.ok(response);
    }
}
