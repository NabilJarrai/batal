package com.batal.repository;

import com.batal.entity.AssessmentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentTemplateRepository extends JpaRepository<AssessmentTemplate, Long> {

    boolean existsByTitleIgnoreCase(String title);

    Optional<AssessmentTemplate> findByTitleIgnoreCase(String title);

    @Query("SELECT DISTINCT t FROM AssessmentTemplate t LEFT JOIN FETCH t.skills ORDER BY t.title ASC")
    List<AssessmentTemplate> findAllWithSkills();

    @Query("SELECT DISTINCT t FROM AssessmentTemplate t LEFT JOIN FETCH t.skills WHERE t.isActive = true ORDER BY t.title ASC")
    List<AssessmentTemplate> findActiveWithSkills();

    /** Groups currently pointing at this template, so it is not edited or retired blindly. */
    @Query("SELECT g.name FROM Group g WHERE g.assessmentTemplate.id = :templateId ORDER BY g.name ASC")
    List<String> findAssignedGroupNames(@Param("templateId") Long templateId);

    @Query("SELECT COUNT(g) FROM Group g WHERE g.assessmentTemplate.id = :templateId")
    long countAssignedGroups(@Param("templateId") Long templateId);
}
