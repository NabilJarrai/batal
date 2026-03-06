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

    @Query("SELECT ss.score FROM SkillScore ss JOIN ss.assessment a JOIN a.player p " +
           "WHERE p.id = :playerId AND ss.skill.id = :skillId AND a.isFinalized = true " +
           "ORDER BY a.assessmentDate DESC")
    List<Integer> findPreviousScoresByPlayerAndSkill(@Param("playerId") Long playerId,
                                                     @Param("skillId") Long skillId);

    @Query("SELECT ss.skill.id, ss.score FROM SkillScore ss " +
           "WHERE ss.assessment.id = (" +
               "SELECT a.id FROM Assessment a " +
               "WHERE a.player.id = :playerId AND a.isFinalized = true " +
               "ORDER BY a.assessmentDate DESC LIMIT 1" +
           ")")
    List<Object[]> findLatestScoresByPlayerId(@Param("playerId") Long playerId);

}
