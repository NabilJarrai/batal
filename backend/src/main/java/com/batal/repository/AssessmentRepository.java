package com.batal.repository;

import com.batal.entity.Assessment;
import com.batal.entity.User;
import com.batal.entity.enums.AssessmentPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByPlayerIdOrderByAssessmentDateDesc(Long playerId);

    List<Assessment> findByAssessmentDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM Assessment a WHERE a.player.group.coach = :coach")
    List<Assessment> findByPlayerGroupCoach(@Param("coach") User coach);

    @Query("SELECT a FROM Assessment a WHERE a.assessmentDate BETWEEN :startDate AND :endDate AND a.player.group.coach = :coach")
    List<Assessment> findByDateRangeAndCoach(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate,
                                             @Param("coach") User coach);

    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player.id = :playerId AND " +
            "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    boolean existsByPlayerIdAndYearAndMonth(@Param("playerId") Long playerId,
                                            @Param("year") int year,
                                            @Param("month") int month);

    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player.id = :playerId AND " +
            "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month AND a.id != :assessmentId")
    boolean existsByPlayerIdAndYearAndMonthAndIdNot(@Param("playerId") Long playerId,
                                                    @Param("year") int year,
                                                    @Param("month") int month,
                                                    @Param("assessmentId") Long assessmentId);

    List<Assessment> findByAssessorIdOrderByAssessmentDateDesc(Long assessorId);

    List<Assessment> findAllByOrderByAssessmentDateDesc();

    // Fetch assessments with all related entities for player self-service
    @Query("SELECT DISTINCT a FROM Assessment a " +
            "LEFT JOIN FETCH a.player p " +
            "LEFT JOIN FETCH a.assessor assessor " +
            "LEFT JOIN FETCH a.skillScores ss " +
            "LEFT JOIN FETCH ss.skill " +
            "WHERE a.player.id = :playerId " +
            "ORDER BY a.assessmentDate DESC")
    List<Assessment> findByPlayerIdWithAllRelationsOrderByAssessmentDateDesc(@Param("playerId") Long playerId);

    // Fetch single assessment with all related entities
    @Query("SELECT a FROM Assessment a " +
            "LEFT JOIN FETCH a.player p " +
            "LEFT JOIN FETCH a.assessor assessor " +
            "LEFT JOIN FETCH a.skillScores ss " +
            "LEFT JOIN FETCH ss.skill " +
            "WHERE a.id = :assessmentId")
    Optional<Assessment> findByIdWithAllRelations(@Param("assessmentId") Long assessmentId);
}
