package com.batal.repository;

import com.batal.entity.Schedule;
import com.batal.entity.Group;
import com.batal.entity.Pitch;
import com.batal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    
    List<Schedule> findByGroup(Group group);
    
    List<Schedule> findByGroupId(Long groupId);
    
    List<Schedule> findByPitch(Pitch pitch);
    
    List<Schedule> findByPitchId(Long pitchId);
    
    List<Schedule> findByDayOfWeek(DayOfWeek dayOfWeek);
    
    List<Schedule> findByGroupAndDayOfWeek(Group group, DayOfWeek dayOfWeek);
    
    List<Schedule> findByGroupIdAndDayOfWeek(Long groupId, DayOfWeek dayOfWeek);
    
    List<Schedule> findByStartTime(LocalTime startTime);
    
    List<Schedule> findByEndTime(LocalTime endTime);
    
    List<Schedule> findByStartTimeBetween(LocalTime startTime, LocalTime endTime);
    
    List<Schedule> findByEndTimeBetween(LocalTime startTime, LocalTime endTime);
    
    List<Schedule> findByValidFrom(LocalDate validFrom);
    
    List<Schedule> findByValidTo(LocalDate validTo);
    
    List<Schedule> findByValidFromBetween(LocalDate startDate, LocalDate endDate);
    
    List<Schedule> findByValidToBetween(LocalDate startDate, LocalDate endDate);
    
    List<Schedule> findByIsActiveTrue();
    
    List<Schedule> findByIsActiveFalse();
    
    List<Schedule> findByGroupAndIsActiveTrue(Group group);
    
    List<Schedule> findByGroupIdAndIsActiveTrue(Long groupId);
    
    List<Schedule> findByNotesContainingIgnoreCase(String notes);
    
    @Query("SELECT s FROM Schedule s WHERE s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesOnDate(@Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s WHERE s.group = :group AND s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesByGroupOnDate(@Param("group") Group group, @Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s WHERE s.group.id = :groupId AND s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesByGroupIdOnDate(@Param("groupId") Long groupId, @Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s WHERE s.pitch = :pitch AND s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesByPitchOnDate(@Param("pitch") Pitch pitch, @Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s WHERE s.pitch.id = :pitchId AND s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesByPitchIdOnDate(@Param("pitchId") Long pitchId, @Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s WHERE s.dayOfWeek = :dayOfWeek AND s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true")
    List<Schedule> findActiveSchedulesByDayOfWeekOnDate(@Param("dayOfWeek") DayOfWeek dayOfWeek, @Param("date") LocalDate date);
    
    @Query("SELECT s FROM Schedule s ORDER BY s.dayOfWeek ASC, s.startTime ASC")
    List<Schedule> findAllOrderByDayOfWeekAndStartTime();
    
    @Query("SELECT s FROM Schedule s WHERE s.group.coach = :coach ORDER BY s.dayOfWeek ASC, s.startTime ASC")
    List<Schedule> findByGroupCoach(@Param("coach") User coach);
    
    @Query("SELECT s FROM Schedule s WHERE s.group.coach.id = :coachId ORDER BY s.dayOfWeek ASC, s.startTime ASC")
    List<Schedule> findByGroupCoachId(@Param("coachId") Long coachId);
    
    // Check for schedule conflicts (overlapping times on same pitch and day)
    @Query("SELECT s FROM Schedule s WHERE s.pitch = :pitch AND s.dayOfWeek = :dayOfWeek AND s.id != :excludeId AND " +
           "s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true AND " +
           "((s.startTime < :endTime AND s.endTime > :startTime))")
    List<Schedule> findConflictingSchedules(@Param("pitch") Pitch pitch, 
                                          @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                          @Param("startTime") LocalTime startTime, 
                                          @Param("endTime") LocalTime endTime, 
                                          @Param("date") LocalDate date,
                                          @Param("excludeId") Long excludeId);
    
    @Query("SELECT s FROM Schedule s WHERE s.pitch.id = :pitchId AND s.dayOfWeek = :dayOfWeek AND s.id != :excludeId AND " +
           "s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true AND " +
           "((s.startTime < :endTime AND s.endTime > :startTime))")
    List<Schedule> findConflictingSchedulesByPitchId(@Param("pitchId") Long pitchId, 
                                                   @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                                   @Param("startTime") LocalTime startTime, 
                                                   @Param("endTime") LocalTime endTime, 
                                                   @Param("date") LocalDate date,
                                                   @Param("excludeId") Long excludeId);
    
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.group = :group")
    long countByGroup(@Param("group") Group group);
    
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.pitch = :pitch")
    long countByPitch(@Param("pitch") Pitch pitch);
    
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.dayOfWeek = :dayOfWeek")
    long countByDayOfWeek(@Param("dayOfWeek") DayOfWeek dayOfWeek);
    
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.isActive = true")
    long countActiveSchedules();
}
