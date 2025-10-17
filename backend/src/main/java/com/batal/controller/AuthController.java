package com.batal.controller;

import com.batal.dto.LoginRequest;
import com.batal.dto.LoginResponse;
import com.batal.dto.RegisterRequest;
import com.batal.dto.SetPasswordRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.ValidateTokenResponse;
import com.batal.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // ========== PASSWORD SETUP VIA EMAIL ==========

    /**
     * Set password using email token (no authentication required)
     */
    @PostMapping("/setup-password")
    public ResponseEntity<?> setupPassword(@Valid @RequestBody SetPasswordRequest request) {
        try {
            LoginResponse response = authService.setPasswordWithToken(request);
            return ResponseEntity.ok(response);
        } catch (com.batal.exception.AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Authentication failed", "message", e.getMessage()));
        } catch (com.batal.exception.ValidationException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation error", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password setup failed", "message", e.getMessage()));
        }
    }

    /**
     * Validate password setup token (no authentication required)
     */
    @GetMapping("/validate-setup-token")
    public ResponseEntity<ValidateTokenResponse> validateSetupToken(@RequestParam String token) {
        ValidateTokenResponse response = authService.validatePasswordSetupToken(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend password setup email (admin only)
     */
    @PostMapping("/resend-setup-email/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> resendSetupEmail(@PathVariable Long userId) {
        try {
            authService.sendPasswordSetupEmail(userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Password setup email sent successfully",
                    "userId", userId
            ));
        } catch (com.batal.exception.BusinessRuleException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot send email", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Failed to send email", "message", e.getMessage()));
        }
    }
}
