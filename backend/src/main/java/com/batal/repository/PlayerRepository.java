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

    // ========== EMAIL-BASED QUERIES ==========
    Optional<Player> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.email = :email")
    Optional<Player> findByEmailWithGroup(@Param("email") String email);

    // ========== ID-BASED QUERIES WITH RELATIONSHIPS ==========
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.id = :id")
    Optional<Player> findByIdWithGroup(@Param("id") Long id);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.parents WHERE p.id = :id")
    Optional<Player> findByIdWithParent(@Param("id") Long id);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments WHERE p.id = :id")
    Optional<Player> findByIdWithAssessments(@Param("id") Long id);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithMemberships(@Param("id") Long id);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group LEFT JOIN FETCH p.parents WHERE p.id = :id")
    Optional<Player> findByIdWithGroupAndParent(@Param("id") Long id);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.assessments LEFT JOIN FETCH p.memberships WHERE p.id = :id")
    Optional<Player> findByIdWithAll(@Param("id") Long id);

    // ========== PARENT-CHILD QUERIES ==========
    @Query("SELECT p FROM Player p JOIN p.parents parent WHERE parent.id = :parentId")
    List<Player> findByParentId(@Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p JOIN p.parents parent LEFT JOIN FETCH p.group WHERE parent.id = :parentId")
    List<Player> findByParentIdWithGroup(@Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p JOIN p.parents parent WHERE p.id = :playerId AND parent.id = :parentId")
    Optional<Player> findByIdAndParentId(@Param("playerId") Long playerId, @Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p JOIN p.parents parent LEFT JOIN FETCH p.group WHERE p.id = :playerId AND parent.id = :parentId")
    Optional<Player> findByIdAndParentIdWithGroup(@Param("playerId") Long playerId, @Param("parentId") Long parentId);

    // ========== ACTIVE STATUS QUERIES ==========
    List<Player> findByIsActiveTrue();

    @Query("SELECT p FROM Player p WHERE p.isActive = true")
    List<Player> findAllActive();

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.isActive = true")
    List<Player> findAllActiveWithGroup();

    // ========== GROUP-BASED QUERIES ==========
    @Query("SELECT p FROM Player p WHERE p.group.id = :groupId")
    List<Player> findByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.group.id = :groupId")
    List<Player> findByGroupIdWithGroup(@Param("groupId") Long groupId);

    @Query("SELECT p FROM Player p WHERE p.group IS NULL AND p.isActive = true")
    List<Player> findUnassignedActivePlayers();

    // ========== PAGINATION QUERIES ==========
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group")
    Page<Player> findAllWithGroup(Pageable pageable);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Player> findAllWithGroupAndSearch(@Param("search") String search, Pageable pageable);

    // ========== SEARCH QUERIES ==========
    @Query("SELECT p FROM Player p WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Player> searchByName(@Param("searchTerm") String searchTerm);

    @Query("SELECT p FROM Player p WHERE " +
           "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Player> searchByNameOrEmail(@Param("searchTerm") String searchTerm);

    // ========== COUNT QUERIES ==========
    @Query("SELECT COUNT(p) FROM Player p WHERE p.isActive = true")
    long countActivePlayers();

    @Query("SELECT COUNT(p) FROM Player p WHERE p.group IS NULL AND p.isActive = true")
    long countUnassignedActivePlayers();

    @Query("SELECT COUNT(p) FROM Player p WHERE p.group.id = :groupId AND p.isActive = true")
    long countActivePlayersByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(p) FROM Player p JOIN p.parents parent WHERE parent.id = :parentId")
    long countByParentId(@Param("parentId") Long parentId);
}
