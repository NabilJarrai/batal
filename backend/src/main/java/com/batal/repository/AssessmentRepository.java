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
    
    List<Assessment> findByPlayer(User player);
    
    List<Assessment> findByPlayerId(Long playerId);
    
    List<Assessment> findByAssessor(User assessor);
    
    List<Assessment> findByAssessorId(Long assessorId);
    
    List<Assessment> findByPlayerAndAssessmentDateBetween(User player, LocalDate startDate, LocalDate endDate);
    
    List<Assessment> findByPlayerIdAndAssessmentDateBetween(Long playerId, LocalDate startDate, LocalDate endDate);
    
    List<Assessment> findByAssessmentDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Assessment> findByPeriod(AssessmentPeriod period);
    
    List<Assessment> findByPlayerAndPeriod(User player, AssessmentPeriod period);
    
    List<Assessment> findByPlayerOrderByAssessmentDateDesc(User player);
    
    List<Assessment> findByPlayerIdOrderByAssessmentDateDesc(Long playerId);
    
    Optional<Assessment> findTopByPlayerOrderByAssessmentDateDesc(User player);
    
    Optional<Assessment> findTopByPlayerIdOrderByAssessmentDateDesc(Long playerId);
    
    List<Assessment> findByIsFinalizedTrue();
    
    List<Assessment> findByIsFinalizedFalse();
    
    List<Assessment> findByPlayerAndIsFinalized(User player, Boolean isFinalized);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.group.coach = :coach")
    List<Assessment> findByPlayerGroupCoach(@Param("coach") User coach);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.group.coach.id = :coachId")
    List<Assessment> findByPlayerGroupCoachId(@Param("coachId") Long coachId);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.group.id = :groupId")
    List<Assessment> findByPlayerGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT a FROM Assessment a WHERE a.assessmentDate BETWEEN :startDate AND :endDate AND a.player.group.coach = :coach")
    List<Assessment> findByDateRangeAndCoach(@Param("startDate") LocalDate startDate, 
                                           @Param("endDate") LocalDate endDate, 
                                           @Param("coach") User coach);
    
    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.player = :player")
    long countByPlayer(@Param("player") User player);
    
    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.player.id = :playerId")
    long countByPlayerId(@Param("playerId") Long playerId);
    
    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.assessor = :assessor")
    long countByAssessor(@Param("assessor") User assessor);
    
    // Duplicate prevention methods
    @Query("SELECT a FROM Assessment a WHERE a.player = :player AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    List<Assessment> findByPlayerAndYearAndMonth(@Param("player") User player, 
                                               @Param("year") int year, 
                                               @Param("month") int month);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.id = :playerId AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    List<Assessment> findByPlayerIdAndYearAndMonth(@Param("playerId") Long playerId, 
                                                 @Param("year") int year, 
                                                 @Param("month") int month);
    
    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player = :player AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    boolean existsByPlayerAndYearAndMonth(@Param("player") User player, 
                                        @Param("year") int year, 
                                        @Param("month") int month);
    
    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player.id = :playerId AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    boolean existsByPlayerIdAndYearAndMonth(@Param("playerId") Long playerId, 
                                          @Param("year") int year, 
                                          @Param("month") int month);
    
    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player = :player AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month AND a.id != :assessmentId")
    boolean existsByPlayerAndYearAndMonthAndIdNot(@Param("player") User player, 
                                                @Param("year") int year, 
                                                @Param("month") int month, 
                                                @Param("assessmentId") Long assessmentId);
    
    @Query("SELECT COUNT(a) > 0 FROM Assessment a WHERE a.player.id = :playerId AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month AND a.id != :assessmentId")
    boolean existsByPlayerIdAndYearAndMonthAndIdNot(@Param("playerId") Long playerId, 
                                                  @Param("year") int year, 
                                                  @Param("month") int month, 
                                                  @Param("assessmentId") Long assessmentId);
    
    List<Assessment> findByAssessorIdOrderByAssessmentDateDesc(Long assessorId);
    
    List<Assessment> findAllByOrderByAssessmentDateDesc();
}
