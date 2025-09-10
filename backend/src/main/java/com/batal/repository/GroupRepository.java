package com.batal.repository;

import com.batal.entity.Group;
import com.batal.entity.User;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    List<Group> findByLevel(Level level);
    
    List<Group> findByAgeGroup(AgeGroup ageGroup);
    
    List<Group> findByLevelAndAgeGroup(Level level, AgeGroup ageGroup);
    
    List<Group> findByCoach(User coach);
    
    List<Group> findByCoachId(Long coachId);
    
    List<Group> findByIsActiveTrue();
    
    List<Group> findByLevelAndIsActiveTrue(Level level);
    
    List<Group> findByAgeGroupAndIsActiveTrue(AgeGroup ageGroup);
    
    List<Group> findByLevelAndAgeGroupAndIsActiveTrue(Level level, AgeGroup ageGroup);
    
    @Query("SELECT g FROM Group g LEFT JOIN FETCH g.players LEFT JOIN FETCH g.coach WHERE g.id = :id")
    Optional<Group> findByIdWithPlayersAndCoach(@Param("id") Long id);
    
    @Query("SELECT g FROM Group g WHERE g.level = :level AND g.ageGroup = :ageGroup AND g.capacity > SIZE(g.players) AND g.isActive = true")
    List<Group> findAvailableGroupsByLevelAndAgeGroup(@Param("level") Level level, @Param("ageGroup") AgeGroup ageGroup);
    
    @Query("SELECT g FROM Group g WHERE SIZE(g.players) < g.capacity AND g.isActive = true")
    List<Group> findAvailableGroups();
    
    @Query("SELECT g FROM Group g WHERE SIZE(g.players) < g.capacity AND g.isActive = true")
    List<Group> findGroupsWithAvailableSpots();
    
    @Query("SELECT g FROM Group g WHERE g.coach IS NULL AND g.isActive = true")
    List<Group> findGroupsWithoutCoach();
    
    
    @Query("SELECT COUNT(g) FROM Group g WHERE g.level = :level AND g.ageGroup = :ageGroup")
    long countByLevelAndAgeGroup(@Param("level") Level level, @Param("ageGroup") AgeGroup ageGroup);
    
    // Advanced filtering query
    @Query("SELECT g FROM Group g WHERE " +
           "(:level IS NULL OR g.level = :level) AND " +
           "(:ageGroup IS NULL OR g.ageGroup = :ageGroup) AND " +
           "(:isActive IS NULL OR g.isActive = :isActive)")
    Page<Group> findGroupsWithFilters(@Param("level") Level level, 
                                     @Param("ageGroup") AgeGroup ageGroup, 
                                     @Param("isActive") Boolean isActive, 
                                     Pageable pageable);
}
