package com.batal.repository;

import com.batal.entity.Skill;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long>, JpaSpecificationExecutor<Skill> {
    
    List<Skill> findByCategory(SkillCategory category);
    
    List<Skill> findByCategoryOrderByDisplayOrderAsc(SkillCategory category);
    
    List<Skill> findByIsActiveTrue();
    
    List<Skill> findByIsActiveFalse();
    
    List<Skill> findByCategoryAndIsActiveTrue(SkillCategory category);
    
    Optional<Skill> findByName(String name);
    
    Optional<Skill> findByNameIgnoreCase(String name);
    
    List<Skill> findByNameContainingIgnoreCase(String nameFragment);
    
    List<Skill> findByDescriptionContainingIgnoreCase(String description);
    
    List<Skill> findAllByOrderByDisplayOrderAsc();
    
    List<Skill> findAllByOrderByCategoryAscDisplayOrderAsc();
    
    @Query("SELECT s FROM Skill s WHERE s.isActive = true ORDER BY s.category ASC, s.displayOrder ASC")
    List<Skill> findActiveSkillsOrderedByCategoryAndDisplay();
    
    @Query("SELECT COUNT(s) FROM Skill s WHERE s.category = :category AND s.isActive = true")
    long countActiveSkillsByCategory(SkillCategory category);
    
    @Query("SELECT DISTINCT s.category FROM Skill s WHERE s.isActive = true ORDER BY s.category")
    List<SkillCategory> findDistinctActiveCategories();
    
    // Level-based queries
    List<Skill> findByApplicableLevelsContaining(Level level);
    
    List<Skill> findByApplicableLevelsContainingOrderByDisplayOrderAsc(Level level);
    
    List<Skill> findByCategoryAndApplicableLevelsContaining(SkillCategory category, Level level);
    
    List<Skill> findByCategoryAndApplicableLevelsContainingOrderByDisplayOrderAsc(SkillCategory category, Level level);
    
    List<Skill> findByApplicableLevelsContainingAndIsActiveTrue(Level level);
    
    List<Skill> findByCategoryAndApplicableLevelsContainingAndIsActiveTrue(SkillCategory category, Level level);
    
    // Duplicate checking
    boolean existsByName(String name);
    
    boolean existsByNameAndIdNot(String name, Long id);
    
    // Usage tracking queries
    @Query("SELECT s FROM Skill s WHERE s.id IN (SELECT DISTINCT ss.skill.id FROM SkillScore ss)")
    List<Skill> findSkillsUsedInAssessments();
    
    @Query("SELECT s FROM Skill s WHERE s.id NOT IN (SELECT DISTINCT ss.skill.id FROM SkillScore ss)")
    List<Skill> findSkillsNotUsedInAssessments();
    
    @Query("SELECT COUNT(ss) FROM SkillScore ss WHERE ss.skill.id = :skillId")
    long countAssessmentsBySkillId(@Param("skillId") Long skillId);
    
    @Query("SELECT s FROM Skill s WHERE s.id = :skillId AND EXISTS (SELECT 1 FROM SkillScore ss WHERE ss.skill.id = :skillId)")
    Optional<Skill> findSkillIfUsedInAssessments(@Param("skillId") Long skillId);
    
    // Batch query to get all usage counts at once (fixes N+1 problem)
    @Query("SELECT s.id, COUNT(ss) FROM Skill s LEFT JOIN SkillScore ss ON s.id = ss.skill.id GROUP BY s.id")
    List<Object[]> findAllSkillUsageCounts();
    
    // Display order management
    @Query("SELECT MAX(s.displayOrder) FROM Skill s WHERE s.category = :category")
    Optional<Integer> findMaxDisplayOrderByCategory(@Param("category") SkillCategory category);
    
    @Query("SELECT s FROM Skill s WHERE s.category = :category AND s.displayOrder > :displayOrder ORDER BY s.displayOrder ASC")
    List<Skill> findByCategoryAndDisplayOrderGreaterThanOrderByDisplayOrderAsc(@Param("category") SkillCategory category, @Param("displayOrder") Integer displayOrder);
}
