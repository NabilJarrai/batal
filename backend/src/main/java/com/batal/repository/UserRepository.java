package com.batal.repository;

import com.batal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
