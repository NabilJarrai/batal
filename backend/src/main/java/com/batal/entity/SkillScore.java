package com.batal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "skill_scores",
       uniqueConstraints = @UniqueConstraint(columnNames = {"assessment_id", "skill_id"}),
       indexes = {
           @Index(name = "idx_skill_score_assessment", columnList = "assessment_id"),
           @Index(name = "idx_skill_score_skill", columnList = "skill_id")
       })
public class SkillScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;
    
    @NotNull
    @Min(1)
    @Max(10)
    @Column(nullable = false)
    private Integer score;
    
    @Size(max = 500)
    @Column(length = 500)
    private String notes;
    
    @Column(name = "previous_score")
    private Integer previousScore;
    
    @Column(name = "improvement")
    private Integer improvement;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public SkillScore() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public SkillScore(Assessment assessment, Skill skill, Integer score) {
        this();
        this.assessment = assessment;
        this.skill = skill;
        this.score = score;
        calculateImprovement();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateImprovement();
    }
    
    @PrePersist
    protected void onCreate() {
        calculateImprovement();
    }
    
    private void calculateImprovement() {
        if (previousScore != null && score != null) {
            this.improvement = score - previousScore;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Assessment getAssessment() {
        return assessment;
    }
    
    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }
    
    public Skill getSkill() {
        return skill;
    }
    
    public void setSkill(Skill skill) {
        this.skill = skill;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
        calculateImprovement();
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Integer getPreviousScore() {
        return previousScore;
    }
    
    public void setPreviousScore(Integer previousScore) {
        this.previousScore = previousScore;
        calculateImprovement();
    }
    
    public Integer getImprovement() {
        return improvement;
    }
    
    public void setImprovement(Integer improvement) {
        this.improvement = improvement;
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
    public boolean hasImproved() {
        return improvement != null && improvement > 0;
    }
    
    public boolean hasDeclined() {
        return improvement != null && improvement < 0;
    }
    
    public boolean isStable() {
        return improvement != null && improvement == 0;
    }
    
    public String getScoreDescription() {
        if (score == null) return "Not scored";
        
        return switch (score) {
            case 1, 2 -> "Needs significant improvement";
            case 3, 4 -> "Below average";
            case 5, 6 -> "Average";
            case 7, 8 -> "Good";
            case 9, 10 -> "Excellent";
            default -> "Invalid score";
        };
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SkillScore)) return false;
        SkillScore that = (SkillScore) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "SkillScore{" +
                "id=" + id +
                ", skill=" + (skill != null ? skill.getName() : null) +
                ", score=" + score +
                ", improvement=" + improvement +
                '}';
    }
}
