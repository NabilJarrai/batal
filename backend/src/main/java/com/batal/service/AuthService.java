package com.batal.service;

import com.batal.dto.ChangeFirstLoginPasswordRequest;
import com.batal.dto.LoginRequest;
import com.batal.dto.LoginResponse;
import com.batal.dto.RegisterRequest;
import com.batal.dto.UserResponse;
import com.batal.entity.Role;
import com.batal.entity.User;
import com.batal.exception.AuthenticationException;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.RoleRepository;
import com.batal.repository.UserRepository;
import com.batal.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtil jwtUtil;
    
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
        
        UserDetailsServiceImpl.UserPrincipal userPrincipal = 
                (UserDetailsServiceImpl.UserPrincipal) authentication.getPrincipal();
        
        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .collect(Collectors.toList());
        
        // Get user details
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));
        
        return new LoginResponse(jwt, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roles, user.isFirstLogin());
    }

    @Transactional
    public LoginResponse changeFirstLoginPassword(ChangeFirstLoginPasswordRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!user.isFirstLogin()) {
            throw new AuthenticationException("Password change not required for this user");
        }

        if (!request.isPasswordMatching()) {
            throw new AuthenticationException("New password and confirmation do not match");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLoginAt(LocalDateTime.now());
        userRepository.save(user);

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String jwt = jwtUtil.generateJwtToken(authentication);

        return new LoginResponse(jwt, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), roleNames, false);
    }
}
