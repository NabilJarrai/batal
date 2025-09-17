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
    
    // Player-based assessment queries (using Player ID)
    List<Assessment> findByPlayerId(Long playerId);
    
    List<Assessment> findByPlayerIdAndAssessmentDateBetween(Long playerId, LocalDate startDate, LocalDate endDate);
    
    List<Assessment> findByPlayerIdOrderByAssessmentDateDesc(Long playerId);
    
    Optional<Assessment> findTopByPlayerIdOrderByAssessmentDateDesc(Long playerId);
    
    // Assessor-based queries (using User entity for coaches/admins)
    List<Assessment> findByAssessor(User assessor);
    
    List<Assessment> findByAssessorId(Long assessorId);
    
    // General queries
    List<Assessment> findByAssessmentDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Assessment> findByPeriod(AssessmentPeriod period);
    
    List<Assessment> findByIsFinalizedTrue();
    
    List<Assessment> findByIsFinalizedFalse();
    
    @Query("SELECT a FROM Assessment a WHERE a.player.user.group.coach = :coach")
    List<Assessment> findByPlayerGroupCoach(@Param("coach") User coach);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.user.group.coach.id = :coachId")
    List<Assessment> findByPlayerGroupCoachId(@Param("coachId") Long coachId);
    
    @Query("SELECT a FROM Assessment a WHERE a.player.user.group.id = :groupId")
    List<Assessment> findByPlayerGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT a FROM Assessment a WHERE a.assessmentDate BETWEEN :startDate AND :endDate AND a.player.user.group.coach = :coach")
    List<Assessment> findByDateRangeAndCoach(@Param("startDate") LocalDate startDate, 
                                           @Param("endDate") LocalDate endDate, 
                                           @Param("coach") User coach);
    
    // Count queries
    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.player.id = :playerId")
    long countByPlayerId(@Param("playerId") Long playerId);
    
    @Query("SELECT COUNT(a) FROM Assessment a WHERE a.assessor = :assessor")
    long countByAssessor(@Param("assessor") User assessor);
    
    // Duplicate prevention methods (using Player ID)
    @Query("SELECT a FROM Assessment a WHERE a.player.id = :playerId AND " +
           "YEAR(a.assessmentDate) = :year AND MONTH(a.assessmentDate) = :month")
    List<Assessment> findByPlayerIdAndYearAndMonth(@Param("playerId") Long playerId, 
                                                 @Param("year") int year, 
                                                 @Param("month") int month);
    
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
