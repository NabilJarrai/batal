package com.batal.repository;

import com.batal.entity.SkillScore;
import com.batal.entity.Assessment;
import com.batal.entity.Skill;
import com.batal.entity.User;
import com.batal.entity.Player;
import com.batal.entity.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SkillScoreRepository extends JpaRepository<SkillScore, Long> {

    @Query("SELECT ss.score FROM SkillScore ss " +
           "WHERE ss.assessment.player.id = :playerId " +
           "AND ss.skill.id = :skillId " +
           "ORDER BY ss.assessment.assessmentDate DESC")
    List<Integer> findLatestScoreByPlayerIdAndSkillId(
        @Param("playerId") Long playerId,
        @Param("skillId") Long skillId);

    @Query("SELECT ss.score FROM SkillScore ss " +
           "WHERE ss.assessment.player.id = :playerId " +
           "AND ss.skill.id = :skillId " +
           "AND ss.assessment.id != :excludeAssessmentId " +
           "ORDER BY ss.assessment.assessmentDate DESC")
    List<Integer> findLatestScoreByPlayerIdAndSkillIdExcludingAssessment(
        @Param("playerId") Long playerId,
        @Param("skillId") Long skillId,
        @Param("excludeAssessmentId") Long excludeAssessmentId);
}
