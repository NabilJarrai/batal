package com.batal.dto;

import com.batal.entity.enums.AssessmentPeriod;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AssessmentDTO {
    private Long id;
    private Long playerId;
    private String playerName;
    private Long assessorId;
    private String assessorName;
    private LocalDate assessmentDate;
    private AssessmentPeriod period;
    private String comments;
    private String coachNotes;
    private Boolean isFinalized;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Map<String, Object>> skillScores;
    
    // Constructors
    public AssessmentDTO() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }
    
    public String getPlayerName() {
        return playerName;
    }
    
    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }
    
    public Long getAssessorId() {
        return assessorId;
    }
    
    public void setAssessorId(Long assessorId) {
        this.assessorId = assessorId;
    }
    
    public String getAssessorName() {
        return assessorName;
    }
    
    public void setAssessorName(String assessorName) {
        this.assessorName = assessorName;
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
    
    public List<Map<String, Object>> getSkillScores() {
        return skillScores;
    }
    
    public void setSkillScores(List<Map<String, Object>> skillScores) {
        this.skillScores = skillScores;
    }
}