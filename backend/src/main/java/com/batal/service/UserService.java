package com.batal.service;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.dto.ChildSummaryDTO;
import com.batal.entity.User;
import com.batal.entity.Role;
import com.batal.entity.Player;
import com.batal.entity.enums.UserType;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.exception.SelfDeletionException;
import com.batal.exception.BusinessRuleException;
import com.batal.repository.UserRepository;
import com.batal.repository.RoleRepository;
import com.batal.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private PlayerRepository playerRepository;

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
    
    // Get all users (only authenticated users: COACH, ADMIN, MANAGER, PARENT)
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAllWithRoles();
        return users.stream()
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

        UserResponse response = new UserResponse(user, roles);

        // If user is a parent, populate children
        if (user.getUserType() == UserType.PARENT) {
            List<Player> children = playerRepository.findByParentIdWithGroup(id);
            List<ChildSummaryDTO> childSummaries = children.stream()
                    .map(this::mapPlayerToChildSummary)
                    .collect(Collectors.toList());
            response.setChildren(childSummaries);
        }

        return response;
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
                case PARENT:
                    defaultRoleName = "PARENT";
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
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();
        
        // Fetch the user to be deleted
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        // Check if admin is trying to delete themselves
        if (currentUserEmail.equals(userToDelete.getEmail())) {
            throw new SelfDeletionException("Administrators cannot delete their own account");
        }
        
        // Check if user has ADMIN role and prevent deletion if they're the last admin
        boolean isAdmin = userToDelete.getRoles().stream()
                .anyMatch(role -> "ADMIN".equals(role.getName()));
        
        if (isAdmin) {
            // Count remaining active admins
            long activeAdminCount = userRepository.countActiveAdminUsers();
            if (activeAdminCount <= 1) {
                throw new BusinessRuleException("Cannot delete the last administrator account");
            }
        }
        
        // Proceed with deletion
        userRepository.delete(userToDelete);
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

    // ========== PARENT-CHILD MANAGEMENT ==========

    /**
     * Assign a child (player) to a parent
     */
    public UserResponse assignChildToParent(Long parentId, Long playerId) {
        // Verify parent exists and is of type PARENT
        User parent = userRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent", parentId));

        if (parent.getUserType() != UserType.PARENT) {
            throw new BusinessRuleException("User with ID " + parentId + " is not a parent");
        }

        // Verify player exists
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));

        // Check if player already has this parent
        if (player.hasParent(parent)) {
            throw new BusinessRuleException("Player " + player.getFullName() +
                    " is already assigned to parent " + parent.getFullName());
        }

        // Assign parent to player (now supports multiple parents)
        player.addParent(parent);
        playerRepository.save(player);

        // Return updated parent response with children
        return getUserById(parentId);
    }

    /**
     * Unassign a child (player) from a parent
     */
    public UserResponse unassignChildFromParent(Long parentId, Long playerId) {
        // Verify parent exists
        User parent = userRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent", parentId));

        // Verify player exists and is assigned to this parent
        Player player = playerRepository.findByIdAndParentId(playerId, parentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Player with ID " + playerId + " not found or not assigned to parent " + parentId));

        // Remove parent assignment (now supports multiple parents)
        player.removeParent(parent);
        playerRepository.save(player);

        // Return updated parent response with children
        return getUserById(parentId);
    }

    /**
     * Get all children (players) for a parent
     */
    public List<ChildSummaryDTO> getParentChildren(Long parentId) {
        // Verify parent exists and is of type PARENT
        User parent = userRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent", parentId));

        if (parent.getUserType() != UserType.PARENT) {
            throw new BusinessRuleException("User with ID " + parentId + " is not a parent");
        }

        List<Player> children = playerRepository.findByParentIdWithGroup(parentId);
        return children.stream()
                .map(this::mapPlayerToChildSummary)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to map Player entity to ChildSummaryDTO
     */
    private ChildSummaryDTO mapPlayerToChildSummary(Player player) {
        String groupName = player.getGroup() != null ? player.getGroup().getName() : null;
        String level = player.getLevel() != null ? player.getLevel().toString() : null;

        return new ChildSummaryDTO(
                player.getId(),
                player.getFirstName(),
                player.getLastName(),
                player.getDateOfBirth(),
                groupName,
                level,
                player.getIsActive()
        );
    }
}
