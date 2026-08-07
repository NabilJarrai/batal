package com.batal.service;

import com.batal.dto.UserCreateRequest;
import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.dto.UserStatusUpdateRequest;
import com.batal.dto.AdminPasswordResetRequest;
import com.batal.dto.ChildSummaryDTO;
import com.batal.entity.User;
import com.batal.entity.Role;
import com.batal.entity.Player;
import com.batal.entity.enums.UserType;
import com.batal.event.PasswordSetupEmailRequestedEvent;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.exception.SelfDeletionException;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ValidationException;
import com.batal.repository.UserRepository;
import com.batal.repository.RoleRepository;
import com.batal.repository.PlayerRepository;
import com.batal.repository.PasswordSetupTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
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
    private PasswordSetupTokenRepository passwordSetupTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;


    // Get academy staff (COACH, ADMIN, MANAGER) with pagination and search.
    // Parents are listed separately by getAllParentUsers.
    public Page<UserResponse> getAllStaffUsers(Pageable pageable, String search) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findStaffUsersWithSearch(search.trim(), pageable);
        } else {
            users = userRepository.findStaffUsers(pageable);
        }

        return users.map(this::toUserResponseWithChildren);
    }

    // Get parent users with pagination and search, each with their children.
    public Page<UserResponse> getAllParentUsers(Pageable pageable, String search) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findParentUsersWithSearch(search.trim(), pageable);
        } else {
            users = userRepository.findParentUsers(pageable);
        }

        return users.map(this::toUserResponseWithChildren);
    }

    /**
     * Set the family's second guardian on a parent account.
     *
     * They are contact details, not an account: the email is optional and
     * users.email cannot be null, so no User is ever created for them. With no
     * name there is nobody to contact, so the email and phone are dropped too -
     * which is also what chk_secondary_parent_named requires.
     */
    private void applySecondaryParent(User user, String name, String email, String phone) {
        String trimmedName = trimToNull(name);
        if (trimmedName == null) {
            user.setSecondaryParentName(null);
            user.setSecondaryParentEmail(null);
            user.setSecondaryParentPhone(null);
            return;
        }
        user.setSecondaryParentName(trimmedName);
        user.setSecondaryParentEmail(trimToNull(email));
        user.setSecondaryParentPhone(trimToNull(phone));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserResponse toUserResponseWithChildren(User user) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());

        UserResponse response = new UserResponse(user, roles);

        // If user is a parent, populate children
        if (user.getUserType() == UserType.PARENT) {
            List<Player> children = playerRepository.findByParentIdWithGroup(user.getId());
            List<ChildSummaryDTO> childSummaries = children.stream()
                    .map(this::mapPlayerToChildSummary)
                    .collect(Collectors.toList());
            response.setChildren(childSummaries);
        }

        return response;
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
        // Don't set password - user will set it via email link
        // user.setPassword() is NOT called here
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setAddress(request.getAddress());
        applySecondaryParent(user, request.getSecondaryParentName(),
                request.getSecondaryParentEmail(), request.getSecondaryParentPhone());
        user.setUserType(request.getUserType() != null ? request.getUserType() : UserType.COACH);
        user.setTitle(request.getTitle());
        user.setEmergencyContactName(request.getEmergencyContactName());
        user.setEmergencyContactPhone(request.getEmergencyContactPhone());
        // Active from the moment the account exists. Login is still impossible
        // until the setup link is used, because no password is stored and
        // BCrypt rejects a null hash - so this affects visibility, not access.
        // "Has this person set a password yet?" is answered by passwordSetAt.
        user.setIsActive(true);
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

        // Sent after this transaction commits. Calling it inline would let a
        // mail failure mark the transaction rollback-only and lose the account.
        eventPublisher.publishEvent(new PasswordSetupEmailRequestedEvent(savedUser.getId()));

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
        // Sent whenever the caller manages this parent's secondary contact. A
        // blank name means "remove them", which is why this is not guarded on
        // non-null the way the fields above are.
        if (request.getSecondaryParentName() != null
                || request.getSecondaryParentEmail() != null
                || request.getSecondaryParentPhone() != null) {
            applySecondaryParent(user, request.getSecondaryParentName(),
                    request.getSecondaryParentEmail(), request.getSecondaryParentPhone());
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

    /**
     * Set a user's password directly, on behalf of an administrator.
     *
     * Any outstanding setup or reset tokens for the account are invalidated, so a
     * link mailed out earlier cannot be used to override what the admin just set.
     * Note that JWTs already issued to this user stay valid until they expire:
     * tokens are stateless and are not tracked server-side.
     */
    public UserResponse resetUserPassword(Long id, AdminPasswordResetRequest request) {
        if (!request.isPasswordMatching()) {
            throw new ValidationException("confirmPassword", "Password and confirmation do not match");
        }

        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPasswordSetAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        passwordSetupTokenRepository.invalidateAllUserTokens(savedUser.getId(), LocalDateTime.now());

        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(savedUser, roles);
    }

    // ========== PARENT SEARCH ==========

    /**
     * Search parent users by name or email
     */
    @Transactional(readOnly = true)
    public List<UserResponse> searchParentUsers(String query) {
        List<User> parents;
        if (query != null && !query.trim().isEmpty()) {
            parents = userRepository.findParentUsersWithSearch(query.trim());
        } else {
            parents = userRepository.findByUserType(UserType.PARENT);
        }
        // With children, so picking a parent shows the players already
        // attached to them without a second round trip.
        return parents.stream()
                .map(this::toUserResponseWithChildren)
                .collect(Collectors.toList());
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

        // Check max 2 parents
        if (player.getParents().size() >= 2) {
            throw new BusinessRuleException("Player " + player.getFullName() +
                    " already has 2 parents assigned");
        }

        // Assign parent to player
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
