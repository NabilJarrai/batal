package com.batal.repository;

import com.batal.entity.User;
import com.batal.entity.enums.UserType;
import com.batal.entity.enums.Level;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);
    
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles")
    List<User> findAllWithRoles();
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findAllByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Optional<User> findByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();
    
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = 'ADMIN' AND u.isActive = true")
    long countActiveAdminUsers();
    
    // Get staff users (excluding PLAYER type) with pagination
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE (u.userType IS NULL OR u.userType != 'PLAYER') " +
           "AND NOT EXISTS (SELECT r FROM u.roles r WHERE r.name = 'PLAYER')")
    Page<User> findStaffUsers(Pageable pageable);
    
    // Get staff users with search functionality  
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE (u.userType IS NULL OR u.userType != 'PLAYER') " +
           "AND NOT EXISTS (SELECT r FROM u.roles r WHERE r.name = 'PLAYER') " +
           "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findStaffUsersWithSearch(@Param("search") String search, Pageable pageable);
    
    // ========== PLAYER-SPECIFIC QUERIES ==========
    
    // Find users by user type
    Page<User> findByUserType(UserType userType, Pageable pageable);
    
    List<User> findByUserType(UserType userType);
    
    List<User> findByUserTypeAndIsActiveTrue(UserType userType);
    
    // Find players with search functionality
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.group WHERE u.userType = :userType " +
           "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findByUserTypeAndFullNameContainingIgnoreCase(@Param("userType") UserType userType, 
                                                           @Param("search") String search, 
                                                           Pageable pageable);
    
    // Find player by ID with group
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.group WHERE u.id = :id AND u.userType = 'PLAYER'")
    Optional<User> findPlayerByIdWithGroup(@Param("id") Long id);
    
    // Find players by group
    List<User> findByGroupIdAndUserType(Long groupId, UserType userType);
    
    // Find unassigned players
    @Query("SELECT u FROM User u WHERE u.userType = 'PLAYER' AND u.group IS NULL AND u.isActive = true")
    List<User> findUnassignedPlayers();
    
    // Find players by date of birth range for group assignment
    @Query("SELECT u FROM User u WHERE u.userType = 'PLAYER' " +
           "AND u.dateOfBirth BETWEEN :startDate AND :endDate " +
           "AND u.level = :level " +
           "AND u.isActive = true")
    List<User> findPlayersByDateOfBirthRangeAndLevel(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   @Param("level") Level level);
    
    // Count players by criteria
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'PLAYER' AND u.isActive = true")
    long countActivePlayers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'PLAYER' AND u.group IS NULL AND u.isActive = true")
    long countUnassignedPlayers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'PLAYER' AND u.group.id = :groupId AND u.isActive = true")
    long countPlayersByGroup(@Param("groupId") Long groupId);
}
