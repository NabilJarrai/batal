package com.batal.service;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.entity.User;
import com.batal.entity.Role;
import com.batal.entity.enums.UserType;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.UserRepository;
import com.batal.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    
    // Get all staff users (excluding PLAYERs) with pagination and search
    public Page<UserResponse> getAllStaffUsers(Pageable pageable, String search) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findStaffUsersWithSearch(search.trim(), pageable);
        } else {
            users = userRepository.findStaffUsers(pageable);
        }
        
        return users.map(user -> new UserResponse(user, user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList())));
    }
    
    // Get all users (legacy method - kept for backward compatibility)
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAllWithRoles();
        return users.stream()
                .filter(user -> user.getUserType() != UserType.PLAYER) // Exclude players
                .map(user -> new UserResponse(user, user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList())))
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(String roleName) {
        List<User> users = userRepository.findAllByRoleName(roleName);
        return users.stream()
                .map(user -> new UserResponse(user, user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList())))
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(user, roles);
    }
    
    // Create new user
    public UserResponse createUser(UserCreateRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setAddress(request.getAddress());
        user.setUserType(request.getUserType() != null ? request.getUserType() : UserType.COACH);
        user.setTitle(request.getTitle());
        user.setEmergencyContactName(request.getEmergencyContactName());
        user.setEmergencyContactPhone(request.getEmergencyContactPhone());
        user.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        user.setJoiningDate(java.time.LocalDate.now()); // Set joining date for coaches/staff
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        // Assign role based on user type (only for authenticated users: COACH, ADMIN, MANAGER)
        Set<Role> roles = new HashSet<>();
        if (request.getUserType() != null) {
            String defaultRoleName = null;
            switch (request.getUserType()) {
                case COACH:
                    defaultRoleName = "COACH";
                    break;
                case ADMIN:
                    defaultRoleName = "ADMIN";
                    break;
                case MANAGER:
                    defaultRoleName = "MANAGER";
                    break;
                default:
                    defaultRoleName = "COACH"; // Default to COACH if no specific type
                    break;
            }
            
            if (defaultRoleName != null) {
                Optional<Role> defaultRole = roleRepository.findByName(defaultRoleName);
                if (defaultRole.isPresent()) {
                    roles.add(defaultRole.get());
                }
            }
        }
        user.setRoles(roles);
        
        User savedUser = userRepository.save(user);
        List<String> roleNames = savedUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(savedUser, roleNames);
    }
    
    // Update user
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        // Update user fields only if they're provided
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getUserType() != null) {
            user.setUserType(request.getUserType());
        }
        if (request.getTitle() != null) {
            user.setTitle(request.getTitle());
        }
        if (request.getEmergencyContactName() != null) {
            user.setEmergencyContactName(request.getEmergencyContactName());
        }
        if (request.getEmergencyContactPhone() != null) {
            user.setEmergencyContactPhone(request.getEmergencyContactPhone());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(savedUser, roles);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        userRepository.delete(user);
    }
    
    // Update user status
    public UserResponse updateUserStatus(Long id, UserStatusUpdateRequest request) {
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        user.setIsActive(request.getIsActive());
        if (request.getInactiveReason() != null) {
            user.setInactiveReason(request.getInactiveReason());
        }
        user.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(savedUser, roles);
    }

    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setIsActive(true);
        user.setInactiveReason(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setIsActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
