package com.batal.repository;

import com.batal.entity.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    
    // User-based queries
    Optional<Player> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    
    @Query("SELECT p FROM Player p JOIN FETCH p.user u LEFT JOIN FETCH u.group WHERE u.email = :email")
    Optional<Player> findByEmailWithGroup(@Param("email") String email);
    
    // ID-based queries with relationships
    @Query("SELECT p FROM Player p JOIN FETCH p.user u LEFT JOIN FETCH u.group WHERE p.id = :id")
    Optional<Player> findByIdWithGroup(@Param("id") Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments WHERE p.id = :id")
    Optional<Player> findByIdWithAssessments(Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithMemberships(Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithAll(Long id);
    
    // Active status queries
    @Query("SELECT p FROM Player p JOIN p.user u WHERE u.isActive = true")
    List<Player> findAllActive();
    
    // Unassigned players query
    @Query("SELECT p FROM Player p JOIN p.user u WHERE u.group IS NULL AND u.isActive = true")
    List<Player> findUnassignedActivePlayers();
    
    // Group-based queries
    @Query("SELECT p FROM Player p JOIN p.user u WHERE u.group.id = :groupId")
    List<Player> findByGroupId(Long groupId);
    
    @Query("SELECT p FROM Player p JOIN FETCH p.user u JOIN FETCH u.group WHERE u.group.id = :groupId")
    List<Player> findByGroupIdWithGroup(@Param("groupId") Long groupId);
    
    // Pagination with relationships
    @Query("SELECT p FROM Player p JOIN FETCH p.user u LEFT JOIN FETCH u.group")
    Page<Player> findAllWithGroup(Pageable pageable);
    
    // Pagination with search
    @Query("SELECT p FROM Player p JOIN FETCH p.user u LEFT JOIN FETCH u.group WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Player> findAllWithGroupAndSearch(@Param("search") String search, Pageable pageable);
    
    // Search functionality
    @Query("SELECT p FROM Player p JOIN p.user u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Player> searchByName(@Param("searchTerm") String searchTerm);
    
    // Email-based queries
    @Query("SELECT p FROM Player p JOIN p.user u WHERE u.email = :email")
    Optional<Player> findByEmail(@Param("email") String email);
    
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Player p JOIN p.user u WHERE u.email = :email")
    boolean existsByEmail(@Param("email") String email);
}
