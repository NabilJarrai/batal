package com.batal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Normalized Player entity containing only player-specific data.
 * Player personal information is stored in User entity with user_type = 'PLAYER'.
 */
@Entity
@Table(name = "players",
       indexes = {
           @Index(name = "idx_players_user_id", columnList = "user_id"),
           @Index(name = "idx_players_position", columnList = "position"),
           @Index(name = "idx_players_jersey_size", columnList = "jersey_size")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_players_user_id", columnNames = "user_id"),
           @UniqueConstraint(name = "uk_players_player_number", columnNames = "player_number")
       })
public class PlayerNormalized {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Size(max = 10)
    @Column(name = "player_number", length = 10, unique = true)
    private String playerNumber;
    
    @Size(max = 50)
    @Column(length = 50)
    private String position;
    
    @Column(name = "assessment_notes", columnDefinition = "TEXT")
    private String assessmentNotes;
    
    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;
    
    @Size(max = 10)
    @Column(name = "jersey_size", length = 10)
    private String jerseySize;
    
    @Column(name = "equipment_notes", columnDefinition = "TEXT")
    private String equipmentNotes;
    
    @Size(max = 50)
    @Column(name = "preferred_training_time", length = 50)
    private String preferredTrainingTime;
    
    @Column(name = "transportation_notes", columnDefinition = "TEXT")
    private String transportationNotes;
    
    @Column(name = "additional_skills", columnDefinition = "TEXT")
    private String additionalSkills;
    
    @Column(name = "development_goals", columnDefinition = "TEXT")
    private String developmentGoals;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public PlayerNormalized() {}
    
    public PlayerNormalized(User user) {
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getPlayerNumber() {
        return playerNumber;
    }
    
    public void setPlayerNumber(String playerNumber) {
        this.playerNumber = playerNumber;
    }
    
    public String getPosition() {
        return position;
    }
    
    public void setPosition(String position) {
        this.position = position;
    }
    
    public String getAssessmentNotes() {
        return assessmentNotes;
    }
    
    public void setAssessmentNotes(String assessmentNotes) {
        this.assessmentNotes = assessmentNotes;
    }
    
    public String getMedicalNotes() {
        return medicalNotes;
    }
    
    public void setMedicalNotes(String medicalNotes) {
        this.medicalNotes = medicalNotes;
    }
    
    public String getJerseySize() {
        return jerseySize;
    }
    
    public void setJerseySize(String jerseySize) {
        this.jerseySize = jerseySize;
    }
    
    public String getEquipmentNotes() {
        return equipmentNotes;
    }
    
    public void setEquipmentNotes(String equipmentNotes) {
        this.equipmentNotes = equipmentNotes;
    }
    
    public String getPreferredTrainingTime() {
        return preferredTrainingTime;
    }
    
    public void setPreferredTrainingTime(String preferredTrainingTime) {
        this.preferredTrainingTime = preferredTrainingTime;
    }
    
    public String getTransportationNotes() {
        return transportationNotes;
    }
    
    public void setTransportationNotes(String transportationNotes) {
        this.transportationNotes = transportationNotes;
    }
    
    public String getAdditionalSkills() {
        return additionalSkills;
    }
    
    public void setAdditionalSkills(String additionalSkills) {
        this.additionalSkills = additionalSkills;
    }
    
    public String getDevelopmentGoals() {
        return developmentGoals;
    }
    
    public void setDevelopmentGoals(String developmentGoals) {
        this.developmentGoals = developmentGoals;
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
    public String getFullName() {
        return user != null ? user.getFullName() : null;
    }
    
    public String getDisplayName() {
        if (user != null) {
            String name = user.getFullName();
            if (playerNumber != null && !playerNumber.isEmpty()) {
                return name + " (#" + playerNumber + ")";
            }
            return name;
        }
        return playerNumber != null ? "#" + playerNumber : "Unknown Player";
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PlayerNormalized)) return false;
        PlayerNormalized that = (PlayerNormalized) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "PlayerNormalized{" +
                "id=" + id +
                ", playerNumber='" + playerNumber + '\'' +
                ", position='" + position + '\'' +
                ", user=" + (user != null ? user.getFullName() : null) +
                '}';
    }
}