package com.batal.repository;

import com.batal.entity.Skill;
import com.batal.entity.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    
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
}
