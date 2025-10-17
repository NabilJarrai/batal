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

    List<Skill> findByCategoryOrderByDisplayOrderAsc(SkillCategory category);

    List<Skill> findAllByOrderByCategoryAscDisplayOrderAsc();

    @Query("SELECT s FROM Skill s WHERE s.isActive = true ORDER BY s.category ASC, s.displayOrder ASC")
    List<Skill> findActiveSkillsOrderedByCategoryAndDisplay();

    List<Skill> findByApplicableLevelsContainingOrderByDisplayOrderAsc(Level level);

    List<Skill> findByApplicableLevelsContainingAndIsActiveTrue(Level level);

    List<Skill> findByCategoryAndApplicableLevelsContainingAndIsActiveTrue(SkillCategory category, Level level);

    // Duplicate checking
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    @Query("SELECT COUNT(ss) FROM SkillScore ss WHERE ss.skill.id = :skillId")
    long countAssessmentsBySkillId(@Param("skillId") Long skillId);

    @Query("SELECT s.id, COUNT(ss) FROM Skill s LEFT JOIN SkillScore ss ON s.id = ss.skill.id GROUP BY s.id")
    List<Object[]> findAllSkillUsageCounts();

    // Display order management
    @Query("SELECT MAX(s.displayOrder) FROM Skill s WHERE s.category = :category")
    Optional<Integer> findMaxDisplayOrderByCategory(@Param("category") SkillCategory category);

}
