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
    boolean existsByEmail(String email);

    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.email = :email")
    Optional<Player> findByEmailWithGroup(@Param("email") String email);

    // ========== ID-BASED QUERIES WITH RELATIONSHIPS ==========
    @Query("SELECT p FROM Player p LEFT JOIN FETCH p.group WHERE p.id = :id")
    Optional<Player> findByIdWithGroup(@Param("id") Long id);

    @Query("SELECT p FROM Player p JOIN p.parents parent LEFT JOIN FETCH p.group WHERE parent.id = :parentId")
    List<Player> findByParentIdWithGroup(@Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p JOIN p.parents parent WHERE p.id = :playerId AND parent.id = :parentId")
    Optional<Player> findByIdAndParentId(@Param("playerId") Long playerId, @Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p JOIN p.parents parent LEFT JOIN FETCH p.group WHERE p.id = :playerId AND parent.id = :parentId")
    Optional<Player> findByIdAndParentIdWithGroup(@Param("playerId") Long playerId, @Param("parentId") Long parentId);

    @Query("SELECT p FROM Player p WHERE p.isActive = true")
    List<Player> findAllActive();

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
}
