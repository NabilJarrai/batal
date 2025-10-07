package com.batal.repository;

import com.batal.entity.User;
import com.batal.entity.enums.UserType;
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

    // ========== EMAIL-BASED QUERIES ==========
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    // ========== ID-BASED QUERIES ==========
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    // ========== ROLE-BASED QUERIES ==========
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles")
    List<User> findAllWithRoles();

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findAllByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Optional<User> findByRoleName(@Param("roleName") String roleName);

    // ========== PARENT QUERIES ==========
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.children WHERE u.id = :userId AND u.userType = 'PARENT'")
    Optional<User> findParentByIdWithChildren(@Param("userId") Long userId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.children WHERE u.email = :email AND u.userType = 'PARENT'")
    Optional<User> findParentByEmailWithChildren(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.userType = 'PARENT'")
    List<User> findAllParents();

    @Query("SELECT u FROM User u WHERE u.userType = 'PARENT' AND u.isActive = true")
    List<User> findAllActiveParents();

    // ========== STAFF QUERIES (COACH, ADMIN, MANAGER, PARENT) ==========
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userType IN ('COACH', 'ADMIN', 'MANAGER', 'PARENT')")
    List<User> findAllAuthenticatingUsers();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userType IN ('COACH', 'ADMIN', 'MANAGER')")
    List<User> findAllStaffUsers();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userType IN ('COACH', 'ADMIN', 'MANAGER', 'PARENT')")
    Page<User> findStaffUsers(Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userType IN ('COACH', 'ADMIN', 'MANAGER', 'PARENT') " +
           "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findStaffUsersWithSearch(@Param("search") String search, Pageable pageable);

    // ========== USER TYPE QUERIES ==========
    List<User> findByUserType(UserType userType);

    Page<User> findByUserType(UserType userType, Pageable pageable);

    List<User> findByUserTypeAndIsActiveTrue(UserType userType);

    @Query("SELECT u FROM User u WHERE u.userType = :userType " +
           "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findByUserTypeWithSearch(@Param("userType") UserType userType,
                                         @Param("search") String search,
                                         Pageable pageable);

    // ========== COUNT QUERIES ==========
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = 'ADMIN' AND u.isActive = true")
    long countActiveAdminUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'COACH' AND u.isActive = true")
    long countActiveCoaches();

    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'PARENT' AND u.isActive = true")
    long countActiveParents();

    @Query("SELECT COUNT(u) FROM User u WHERE u.userType IN ('COACH', 'ADMIN', 'MANAGER', 'PARENT') AND u.isActive = true")
    long countActiveAuthenticatingUsers();
}
