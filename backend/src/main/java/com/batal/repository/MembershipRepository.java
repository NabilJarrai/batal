package com.batal.repository;

import com.batal.entity.Membership;
import com.batal.entity.MembershipType;
import com.batal.entity.User;
import com.batal.entity.enums.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    
    List<Membership> findByPlayer(User player);
    
    List<Membership> findByPlayerId(Long playerId);
    
    List<Membership> findByMembershipType(MembershipType membershipType);
    
    List<Membership> findByMembershipTypeId(Long membershipTypeId);
    
    List<Membership> findByStatus(MembershipStatus status);
    
    List<Membership> findByPlayerAndStatus(User player, MembershipStatus status);
    
    List<Membership> findByPlayerIdAndStatus(Long playerId, MembershipStatus status);
    
    Optional<Membership> findTopByPlayerOrderByStartDateDesc(User player);
    
    Optional<Membership> findTopByPlayerIdOrderByStartDateDesc(Long playerId);
    
    List<Membership> findByStartDate(LocalDate startDate);
    
    List<Membership> findByEndDate(LocalDate endDate);
    
    List<Membership> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Membership> findByEndDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<Membership> findByPlayerAndStartDateBetween(User player, LocalDate startDate, LocalDate endDate);
    
    List<Membership> findByPlayerIdAndStartDateBetween(Long playerId, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT m FROM Membership m WHERE m.startDate <= :date AND (m.endDate IS NULL OR m.endDate >= :date)")
    List<Membership> findActiveMembershipsOnDate(@Param("date") LocalDate date);
    
    @Query("SELECT m FROM Membership m WHERE m.player = :player AND m.startDate <= :date AND (m.endDate IS NULL OR m.endDate >= :date)")
    Optional<Membership> findActivePlayerMembershipOnDate(@Param("player") User player, @Param("date") LocalDate date);
    
    @Query("SELECT m FROM Membership m WHERE m.player.id = :playerId AND m.startDate <= :date AND (m.endDate IS NULL OR m.endDate >= :date)")
    Optional<Membership> findActivePlayerMembershipOnDateById(@Param("playerId") Long playerId, @Param("date") LocalDate date);
    
    @Query("SELECT m FROM Membership m WHERE m.endDate IS NOT NULL AND m.endDate < CURRENT_DATE AND m.status = 'ACTIVE'")
    List<Membership> findExpiredActiveMemberships();
    
    @Query("SELECT m FROM Membership m WHERE m.endDate IS NOT NULL AND m.endDate BETWEEN :startDate AND :endDate")
    List<Membership> findMembershipsExpiringBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COUNT(m) FROM Membership m WHERE m.status = :status")
    long countByStatus(@Param("status") MembershipStatus status);
    
    @Query("SELECT COUNT(m) FROM Membership m WHERE m.membershipType = :membershipType")
    long countByMembershipType(@Param("membershipType") MembershipType membershipType);
    
    @Query("SELECT COUNT(m) FROM Membership m WHERE m.player = :player")
    long countByPlayer(@Param("player") User player);
    
    @Query("SELECT SUM(m.totalAmount) FROM Membership m WHERE m.status = :status")
    BigDecimal getTotalRevenueByStatus(@Param("status") MembershipStatus status);
    
    @Query("SELECT SUM(m.totalAmount) FROM Membership m WHERE m.startDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueInPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT m FROM Membership m WHERE m.player.group.coach = :coach")
    List<Membership> findByPlayerGroupCoach(@Param("coach") User coach);
}
