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
    
    List<SkillScore> findByAssessment(Assessment assessment);
    
    List<SkillScore> findByAssessmentId(Long assessmentId);
    
    List<SkillScore> findBySkill(Skill skill);
    
    List<SkillScore> findBySkillId(Long skillId);
    
    Optional<SkillScore> findByAssessmentAndSkill(Assessment assessment, Skill skill);
    
    Optional<SkillScore> findByAssessmentIdAndSkillId(Long assessmentId, Long skillId);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user = :user")
    List<SkillScore> findByAssessmentPlayer(@Param("user") User user);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user.id = :userId")
    List<SkillScore> findByAssessmentPlayerId(@Param("userId") Long userId);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill.category = :category")
    List<SkillScore> findByPlayerAndSkillCategory(@Param("user") User user, @Param("category") SkillCategory category);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user.id = :userId AND ss.skill.category = :category")
    List<SkillScore> findByPlayerIdAndSkillCategory(@Param("userId") Long userId, @Param("category") SkillCategory category);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.assessment.assessmentDate BETWEEN :startDate AND :endDate")
    List<SkillScore> findByPlayerAndDateRange(@Param("user") User user, 
                                            @Param("startDate") LocalDate startDate, 
                                            @Param("endDate") LocalDate endDate);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user = :user ORDER BY ss.assessment.assessmentDate DESC")
    List<SkillScore> findByPlayerOrderByDateDesc(@Param("user") User user);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user.id = :userId ORDER BY ss.assessment.assessmentDate DESC")
    List<SkillScore> findByPlayerIdOrderByDateDesc(@Param("userId") Long userId);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill = :skill ORDER BY ss.assessment.assessmentDate DESC")
    List<SkillScore> findByPlayerAndSkillOrderByDateDesc(@Param("user") User user, @Param("skill") Skill skill);
    
    @Query("SELECT AVG(ss.score) FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill.category = :category")
    Double getAverageScoreByPlayerAndCategory(@Param("user") User user, @Param("category") SkillCategory category);
    
    @Query("SELECT AVG(ss.score) FROM SkillScore ss WHERE ss.assessment.player.user.id = :userId AND ss.skill.category = :category")
    Double getAverageScoreByPlayerIdAndCategory(@Param("userId") Long userId, @Param("category") SkillCategory category);
    
    @Query("SELECT AVG(ss.score) FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill = :skill")
    Double getAverageScoreByPlayerAndSkill(@Param("user") User user, @Param("skill") Skill skill);
    
    @Query("SELECT MAX(ss.score) FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill = :skill")
    Integer getMaxScoreByPlayerAndSkill(@Param("user") User user, @Param("skill") Skill skill);
    
    @Query("SELECT MIN(ss.score) FROM SkillScore ss WHERE ss.assessment.player.user = :user AND ss.skill = :skill")
    Integer getMinScoreByPlayerAndSkill(@Param("user") User user, @Param("skill") Skill skill);
    
    @Query("SELECT ss FROM SkillScore ss WHERE ss.assessment.player.user.group.coach = :coach")
    List<SkillScore> findByPlayerGroupCoach(@Param("coach") User coach);
    
    @Query("SELECT COUNT(ss) FROM SkillScore ss WHERE ss.assessment.player.user = :user")
    long countByPlayer(@Param("user") User user);
    
    @Query("SELECT COUNT(ss) FROM SkillScore ss WHERE ss.skill = :skill")
    long countBySkill(@Param("skill") Skill skill);
    
    void deleteByAssessmentId(Long assessmentId);
}
