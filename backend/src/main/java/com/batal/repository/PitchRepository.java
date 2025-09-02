package com.batal.repository;

import com.batal.entity.Pitch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PitchRepository extends JpaRepository<Pitch, Long> {
    
    List<Pitch> findByZones(Integer zones);
    
    List<Pitch> findByIsActiveTrue();
    
    List<Pitch> findByIsActiveFalse();
    
    List<Pitch> findByZonesAndIsActiveTrue(Integer zones);
    
    Optional<Pitch> findByName(String name);
    
    Optional<Pitch> findByNameIgnoreCase(String name);
    
    List<Pitch> findByNameContainingIgnoreCase(String nameFragment);
    
    List<Pitch> findByDescriptionContainingIgnoreCase(String description);
    
    List<Pitch> findByLocationContainingIgnoreCase(String location);
    
    List<Pitch> findAllByOrderByZonesAscNameAsc();
    
    List<Pitch> findByZonesOrderByNameAsc(Integer zones);
    
    @Query("SELECT p FROM Pitch p WHERE p.isActive = true ORDER BY p.zones ASC, p.name ASC")
    List<Pitch> findActivePitchesOrderedByZonesAndName();
    
    @Query("SELECT COUNT(p) FROM Pitch p WHERE p.zones = :zones AND p.isActive = true")
    long countActiveByZones(@Param("zones") Integer zones);
    
    @Query("SELECT DISTINCT p.zones FROM Pitch p WHERE p.isActive = true ORDER BY p.zones")
    List<Integer> findDistinctActiveZones();
    
    // Methods to check pitch availability for scheduling
    @Query("SELECT p FROM Pitch p WHERE p.isActive = true AND p.id NOT IN " +
           "(SELECT s.pitch.id FROM Schedule s WHERE s.dayOfWeek = :dayOfWeek AND " +
           "s.startTime < :endTime AND s.endTime > :startTime AND " +
           "s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true)")
    List<Pitch> findAvailablePitches(
           @Param("dayOfWeek") DayOfWeek dayOfWeek,
           @Param("startTime") LocalTime startTime, 
           @Param("endTime") LocalTime endTime,
           @Param("date") LocalDate date);
    
    @Query("SELECT p FROM Pitch p WHERE p.isActive = true AND p.zones = :zones AND p.id NOT IN " +
           "(SELECT s.pitch.id FROM Schedule s WHERE s.dayOfWeek = :dayOfWeek AND " +
           "s.startTime < :endTime AND s.endTime > :startTime AND " +
           "s.validFrom <= :date AND (s.validTo IS NULL OR s.validTo >= :date) AND s.isActive = true)")
    List<Pitch> findAvailablePitchesByZones(
           @Param("zones") Integer zones,
           @Param("dayOfWeek") DayOfWeek dayOfWeek,
           @Param("startTime") LocalTime startTime, 
           @Param("endTime") LocalTime endTime,
           @Param("date") LocalDate date);
    
    @Query("SELECT COUNT(g) FROM Group g WHERE g.pitch = :pitch")
    long countAssignedGroups(@Param("pitch") Pitch pitch);
    
    @Query("SELECT COUNT(g) FROM Group g WHERE g.pitch.id = :pitchId")
    long countAssignedGroupsById(@Param("pitchId") Long pitchId);
}
