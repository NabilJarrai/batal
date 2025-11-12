package com.batal.service;

import com.batal.dto.ChildSummaryDTO;
import com.batal.dto.ForgotPasswordRequest;
import com.batal.dto.LoginRequest;
import com.batal.dto.LoginResponse;
import com.batal.dto.RegisterRequest;
import com.batal.dto.ResetPasswordRequest;
import com.batal.dto.SetPasswordRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.ValidateTokenResponse;
import com.batal.entity.PasswordSetupToken;
import com.batal.entity.Player;
import com.batal.entity.Role;
import com.batal.entity.User;
import com.batal.entity.enums.TokenType;
import com.batal.exception.AuthenticationException;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.exception.ValidationException;
import com.batal.repository.PasswordSetupTokenRepository;
import com.batal.repository.PlayerRepository;
import com.batal.repository.RoleRepository;
import com.batal.repository.UserRepository;
import com.batal.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordSetupTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${batal.password-setup.token-expiry-hours:48}")
    private int tokenExpiryHours;

    @Transactional
    public UserResponse register(RegisterRequest registerRequest) {
        // Check if user already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", registerRequest.getEmail());
        }
        
        // Create new user
        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPhone(registerRequest.getPhone());
        user.setDateOfBirth(registerRequest.getDateOfBirth());
        user.setGender(registerRequest.getGender());
        user.setAddress(registerRequest.getAddress());
        user.setEmergencyContactName(registerRequest.getEmergencyContactName());
        user.setEmergencyContactPhone(registerRequest.getEmergencyContactPhone());
        user.setIsActive(true);
        
        // Add role
        Role role = roleRepository.findByName(registerRequest.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", registerRequest.getRole()));
        
        user.addRole(role);
        
        User savedUser = userRepository.save(user);
        
        List<String> roleNames = savedUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        
        return new UserResponse(savedUser, roleNames);
    }
    
    public LoginResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtil.generateJwtToken(authentication);

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsServiceImpl.UserPrincipal)) {
            throw new AuthenticationException("Invalid authentication principal");
        }

        UserDetailsServiceImpl.UserPrincipal userPrincipal =
                (UserDetailsServiceImpl.UserPrincipal) principal;

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .collect(Collectors.toList());

        // Get user details
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        // If user is a parent, fetch their children
        List<ChildSummaryDTO> children = null;
        if (user.isParent()) {
            children = fetchChildrenForParent(user.getId());
        }

        return new LoginResponse(jwt, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roles, children);
    }

    /**
     * Fetch and convert children to ChildSummaryDTO for parent login
     */
    private List<ChildSummaryDTO> fetchChildrenForParent(Long parentUserId) {
        List<Player> children = playerRepository.findByParentIdWithGroup(parentUserId);

        if (children == null || children.isEmpty()) {
            return Collections.emptyList();
        }

        return children.stream()
                .map(this::convertToChildSummary)
                .collect(Collectors.toList());
    }

    /**
     * Convert Player entity to ChildSummaryDTO
     */
    private ChildSummaryDTO convertToChildSummary(Player player) {
        return new ChildSummaryDTO(
                player.getId(),
                player.getFirstName(),
                player.getLastName(),
                player.getDateOfBirth(),
                player.getGroup() != null ? player.getGroup().getName() : null,
                player.getLevel() != null ? player.getLevel().toString() : null,
                player.getIsActive()
        );
    }

    // ========== PASSWORD SETUP VIA EMAIL ==========

    /**
     * Set password for first-time users via email token
     */
    @Transactional
    public LoginResponse setPasswordWithToken(SetPasswordRequest request) {
        // Validate passwords match
        if (!request.isPasswordMatching()) {
            throw new ValidationException("password", "Passwords do not match");
        }

        // Find and validate token
        PasswordSetupToken token = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new AuthenticationException("Invalid or expired token"));

        if (!token.isValid()) {
            if (token.isUsed()) {
                throw new AuthenticationException("This token has already been used");
            } else {
                throw new AuthenticationException("This token has expired. Please contact your administrator for a new setup link.");
            }
        }

        // Get user and set password
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPasswordSetAt(LocalDateTime.now());
        user.setIsActive(true); // Activate user once password is set
        userRepository.save(user);

        // Mark token as used
        token.markAsUsed();
        tokenRepository.save(token);

        // Invalidate all other tokens for this user
        tokenRepository.invalidateAllUserTokens(user.getId(), LocalDateTime.now());

        // Generate JWT token using email (user is not authenticated yet during password setup)
        String jwt = jwtUtil.generateJwtToken(user.getEmail());

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        // If user is a parent, fetch their children
        List<ChildSummaryDTO> children = null;
        if (user.isParent()) {
            children = fetchChildrenForParent(user.getId());
        }

        return new LoginResponse(jwt, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roleNames, children);
    }

    /**
     * Validate token without using it
     */
    public ValidateTokenResponse validatePasswordSetupToken(String token) {
        var tokenOpt = tokenRepository.findByTokenWithUser(token);

        if (tokenOpt.isEmpty()) {
            return ValidateTokenResponse.invalid("Invalid token");
        }

        PasswordSetupToken setupToken = tokenOpt.get();

        if (setupToken.isUsed()) {
            return ValidateTokenResponse.invalid("Token already used");
        }

        if (setupToken.isExpired()) {
            return ValidateTokenResponse.invalid("Token expired. Please contact your administrator for a new setup link.");
        }

        User user = setupToken.getUser();
        return ValidateTokenResponse.valid(user.getEmail(), user.getFullName());
    }

    /**
     * Generate and send password setup token
     */
    @Transactional
    public void sendPasswordSetupEmail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Check if user already has password set
        if (user.getPasswordSetAt() != null) {
            throw new BusinessRuleException("User has already set their password");
        }

        // Invalidate existing tokens
        tokenRepository.invalidateAllUserTokens(userId, LocalDateTime.now());

        // Generate new token
        String tokenString = generateSecureToken();

        PasswordSetupToken token = new PasswordSetupToken();
        token.setUser(user);
        token.setToken(tokenString);
        token.setTokenType(TokenType.SETUP);
        token.setExpiresAt(LocalDateTime.now().plusHours(tokenExpiryHours));
        tokenRepository.save(token);

        // Send email
        emailService.sendPasswordSetupEmail(user, tokenString);

        // Update last sent timestamp
        user.setPasswordSetupEmailLastSentAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Resend password setup email by email address (public endpoint)
     * This method is called by unauthenticated users who need a new setup link.
     *
     * Security considerations:
     * - Always returns success (doesn't reveal if email exists)
     * - Enforces 5-minute rate limiting to prevent abuse
     * - Only sends email if user exists, hasn't set password, and cooldown elapsed
     */
    @Transactional
    public void resendPasswordSetupEmailByEmail(String email) {
        // Find user by email - if not found, silently succeed (security best practice)
        var userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // Don't reveal that email doesn't exist - just return
            // This prevents email enumeration attacks
            return;
        }

        User user = userOpt.get();

        // Check if user has already set password
        if (user.getPasswordSetAt() != null) {
            // User already set password, silently succeed
            // They should use forgot-password flow instead
            return;
        }

        // Check rate limiting (5-minute cooldown)
        LocalDateTime lastSent = user.getPasswordSetupEmailLastSentAt();
        if (lastSent != null) {
            LocalDateTime cooldownExpires = lastSent.plusMinutes(5);
            if (LocalDateTime.now().isBefore(cooldownExpires)) {
                // Still in cooldown period - throw exception
                long secondsRemaining = java.time.Duration.between(
                    LocalDateTime.now(), cooldownExpires
                ).getSeconds();
                throw new BusinessRuleException(
                    "Please wait " + secondsRemaining + " seconds before requesting another setup email"
                );
            }
        }

        // Invalidate existing tokens
        tokenRepository.invalidateAllUserTokens(user.getId(), LocalDateTime.now());

        // Generate new token
        String tokenString = generateSecureToken();

        PasswordSetupToken token = new PasswordSetupToken();
        token.setUser(user);
        token.setToken(tokenString);
        token.setTokenType(TokenType.SETUP);
        token.setExpiresAt(LocalDateTime.now().plusHours(tokenExpiryHours));
        tokenRepository.save(token);

        // Send email
        emailService.sendPasswordSetupEmail(user, tokenString);

        // Update last sent timestamp
        user.setPasswordSetupEmailLastSentAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Generate cryptographically secure random token
     */
    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[48]; // 48 bytes = 64 characters in base64
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // ========== PASSWORD RESET (FORGOT PASSWORD) ==========

    /**
     * Initiate password reset process by sending reset email
     * Public endpoint - anyone can request password reset
     * Note: For security, we don't reveal if the email exists or not
     */
    @Transactional
    public void initiatePasswordReset(ForgotPasswordRequest request) {
        // Find user by email - if not found, silently succeed (security best practice)
        var userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            // Don't reveal that email doesn't exist - just log and return
            // This prevents email enumeration attacks
            return;
        }

        User user = userOpt.get();

        // Check if user has set a password (only allow reset if they have)
        if (user.getPasswordSetAt() == null) {
            // User hasn't set password yet, they should use setup flow instead
            // Silently succeed (don't reveal this info)
            return;
        }

        // Invalidate existing reset tokens for this user
        tokenRepository.invalidateAllUserTokensByType(user.getId(), TokenType.RESET, LocalDateTime.now());

        // Generate new reset token
        String tokenString = generateSecureToken();

        PasswordSetupToken token = new PasswordSetupToken();
        token.setUser(user);
        token.setToken(tokenString);
        token.setTokenType(TokenType.RESET);
        token.setExpiresAt(LocalDateTime.now().plusHours(tokenExpiryHours));
        tokenRepository.save(token);

        // Send reset email
        emailService.sendPasswordResetEmail(user, tokenString);
    }

    /**
     * Reset password using reset token
     */
    @Transactional
    public void resetPasswordWithToken(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.isPasswordMatching()) {
            throw new ValidationException("password", "Passwords do not match");
        }

        // Find and validate token
        PasswordSetupToken token = tokenRepository.findByTokenAndTokenType(
                request.getToken(), TokenType.RESET)
                .orElseThrow(() -> new AuthenticationException("Invalid or expired reset token"));

        if (!token.isValid()) {
            if (token.isUsed()) {
                throw new AuthenticationException("This reset link has already been used");
            } else {
                throw new AuthenticationException("This reset link has expired. Please request a new password reset.");
            }
        }

        // Get user and update password
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPasswordSetAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark token as used
        token.markAsUsed();
        tokenRepository.save(token);

        // Invalidate all other reset tokens for this user
        tokenRepository.invalidateAllUserTokensByType(user.getId(), TokenType.RESET, LocalDateTime.now());
    }

    /**
     * Validate password reset token without using it
     */
    public ValidateTokenResponse validatePasswordResetToken(String token) {
        var tokenOpt = tokenRepository.findByTokenAndTokenTypeWithUser(token, TokenType.RESET);

        if (tokenOpt.isEmpty()) {
            return ValidateTokenResponse.invalid("Invalid reset token");
        }

        PasswordSetupToken resetToken = tokenOpt.get();

        if (resetToken.isUsed()) {
            return ValidateTokenResponse.invalid("Reset link already used");
        }

        if (resetToken.isExpired()) {
            return ValidateTokenResponse.invalid("Reset link expired. Please request a new password reset.");
        }

        User user = resetToken.getUser();
        return ValidateTokenResponse.valid(user.getEmail(), user.getFullName());
    }
}
