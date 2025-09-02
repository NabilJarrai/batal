package com.batal.entity;

import com.batal.entity.enums.MembershipStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "memberships",
       indexes = {
           @Index(name = "idx_memberships_player_id", columnList = "player_id"),
           @Index(name = "idx_memberships_status", columnList = "status"),
           @Index(name = "idx_memberships_dates", columnList = "start_date, end_date")
       })
public class Membership {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_type_id", nullable = false)
    private MembershipType membershipType;
    
    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipStatus status = MembershipStatus.ACTIVE;
    
    @NotNull
    @DecimalMin("0.0")
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @DecimalMin("0.0")
    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;
    
    @Min(0)
    @Column(name = "sessions_remaining")
    private Integer sessionsRemaining = 0;
    
    @OneToMany(mappedBy = "membership", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<Payment> payments = new HashSet<>();
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Membership() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Membership(User player, MembershipType membershipType, LocalDate startDate, LocalDate endDate) {
        this();
        this.player = player;
        this.membershipType = membershipType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalAmount = membershipType.getPrice();
        this.sessionsRemaining = membershipType.getSessions();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getPlayer() {
        return player;
    }
    
    public void setPlayer(User player) {
        this.player = player;
    }
    
    public MembershipType getMembershipType() {
        return membershipType;
    }
    
    public void setMembershipType(MembershipType membershipType) {
        this.membershipType = membershipType;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    
    public MembershipStatus getStatus() {
        return status;
    }
    
    public void setStatus(MembershipStatus status) {
        this.status = status;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public BigDecimal getPaidAmount() {
        return paidAmount;
    }
    
    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }
    
    public Integer getSessionsRemaining() {
        return sessionsRemaining;
    }
    
    public void setSessionsRemaining(Integer sessionsRemaining) {
        this.sessionsRemaining = sessionsRemaining;
    }
    
    public Set<Payment> getPayments() {
        return payments;
    }
    
    public void setPayments(Set<Payment> payments) {
        this.payments = payments;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Utility methods
    public BigDecimal getRemainingAmount() {
        return totalAmount.subtract(paidAmount);
    }
    
    public boolean isFullyPaid() {
        return paidAmount.compareTo(totalAmount) >= 0;
    }
    
    public boolean isExpired() {
        return endDate.isBefore(LocalDate.now());
    }
    
    public boolean isActive() {
        return status == MembershipStatus.ACTIVE && !isExpired();
    }
    
    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setMembership(this);
        updatePaidAmount();
    }
    
    public void removePayment(Payment payment) {
        payments.remove(payment);
        payment.setMembership(null);
        updatePaidAmount();
    }
    
    private void updatePaidAmount() {
        this.paidAmount = payments.stream()
                .filter(p -> p.getStatus() == com.batal.entity.enums.PaymentStatus.PAID)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public int getDaysRemaining() {
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }
    
    public double getPaymentProgress() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) return 1.0;
        return paidAmount.divide(totalAmount, 4, java.math.RoundingMode.HALF_UP).doubleValue();
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Membership)) return false;
        Membership that = (Membership) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Membership{" +
                "id=" + id +
                ", player=" + (player != null ? player.getFullName() : null) +
                ", membershipType=" + (membershipType != null ? membershipType.getName() : null) +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                '}';
    }
}
