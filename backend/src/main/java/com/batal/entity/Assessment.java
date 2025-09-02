package com.batal.entity;

import com.batal.entity.enums.AssessmentPeriod;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "assessments",
       indexes = {
           @Index(name = "idx_assessment_player", columnList = "player_id"),
           @Index(name = "idx_assessment_date", columnList = "assessment_date"),
           @Index(name = "idx_assessment_player_date", columnList = "player_id, assessment_date")
       })
public class Assessment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessor_id", nullable = false)
    private User assessor;
    
    @NotNull
    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssessmentPeriod period;
    
    @Size(max = 1000)
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    @Size(max = 1000)
    @Column(name = "coach_notes", columnDefinition = "TEXT")
    private String coachNotes;
    
    @OneToMany(mappedBy = "assessment", fetch = FetchType.LAZY, 
               cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SkillScore> skillScores = new HashSet<>();
    
    @Column(name = "is_finalized")
    private Boolean isFinalized = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Assessment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Assessment(User player, User assessor, LocalDate assessmentDate, AssessmentPeriod period) {
        this();
        this.player = player;
        this.assessor = assessor;
        this.assessmentDate = assessmentDate;
        this.period = period;
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
    
    public User getAssessor() {
        return assessor;
    }
    
    public void setAssessor(User assessor) {
        this.assessor = assessor;
    }
    
    public LocalDate getAssessmentDate() {
        return assessmentDate;
    }
    
    public void setAssessmentDate(LocalDate assessmentDate) {
        this.assessmentDate = assessmentDate;
    }
    
    public AssessmentPeriod getPeriod() {
        return period;
    }
    
    public void setPeriod(AssessmentPeriod period) {
        this.period = period;
    }
    
    public String getComments() {
        return comments;
    }
    
    public void setComments(String comments) {
        this.comments = comments;
    }
    
    public String getCoachNotes() {
        return coachNotes;
    }
    
    public void setCoachNotes(String coachNotes) {
        this.coachNotes = coachNotes;
    }
    
    public Set<SkillScore> getSkillScores() {
        return skillScores;
    }
    
    public void setSkillScores(Set<SkillScore> skillScores) {
        this.skillScores = skillScores;
    }
    
    public Boolean getIsFinalized() {
        return isFinalized;
    }
    
    public void setIsFinalized(Boolean isFinalized) {
        this.isFinalized = isFinalized;
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
    public void addSkillScore(SkillScore skillScore) {
        skillScores.add(skillScore);
        skillScore.setAssessment(this);
    }
    
    public void removeSkillScore(SkillScore skillScore) {
        skillScores.remove(skillScore);
        skillScore.setAssessment(null);
    }
    
    public SkillScore getSkillScore(Skill skill) {
        return skillScores.stream()
                .filter(score -> score.getSkill().equals(skill))
                .findFirst()
                .orElse(null);
    }
    
    public double getAverageScore() {
        return skillScores.stream()
                .mapToInt(SkillScore::getScore)
                .average()
                .orElse(0.0);
    }
    
    public double getCategoryAverageScore(com.batal.entity.enums.SkillCategory category) {
        return skillScores.stream()
                .filter(score -> score.getSkill().getCategory() == category)
                .mapToInt(SkillScore::getScore)
                .average()
                .orElse(0.0);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Assessment)) return false;
        Assessment that = (Assessment) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Assessment{" +
                "id=" + id +
                ", player=" + (player != null ? player.getFullName() : null) +
                ", assessor=" + (assessor != null ? assessor.getFullName() : null) +
                ", assessmentDate=" + assessmentDate +
                ", period=" + period +
                ", isFinalized=" + isFinalized +
                '}';
    }
}
