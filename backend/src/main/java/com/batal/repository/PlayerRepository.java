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
    
    // Email-based queries
    boolean existsByEmail(String email);
    Optional<Player> findByEmail(String email);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.email = :email")
    Optional<Player> findByEmailWithGroup(@Param("email") String email);
    
    // ID-based queries with relationships
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.id = :id")
    Optional<Player> findByIdWithGroup(@Param("id") Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments WHERE p.id = :id")
    Optional<Player> findByIdWithAssessments(Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithMemberships(Long id);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithAll(Long id);
    
    // Active status queries
    @Query("SELECT p FROM Player p WHERE p.isActive = true")
    List<Player> findAllActive();
    
    List<Player> findByIsActiveTrue();
    
    // Group-based queries
    @Query("SELECT p FROM Player p WHERE p.group.id = :groupId")
    List<Player> findByGroupId(Long groupId);
    
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.group.id = :groupId")
    List<Player> findByGroupIdWithGroup(@Param("groupId") Long groupId);
    
    // Pagination with relationships
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group")
    Page<Player> findAllWithGroup(Pageable pageable);
    
    // Search functionality
    @Query("SELECT p FROM Player p WHERE LOWER(p.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Player> searchByName(@Param("searchTerm") String searchTerm);
    
    List<Player> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);
}
