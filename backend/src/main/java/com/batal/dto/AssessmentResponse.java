package com.batal.dto;

import com.batal.entity.enums.AssessmentPeriod;
import com.batal.entity.enums.SkillCategory;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AssessmentResponse {
    
    private Long id;
    private Long playerId;
    private String playerName;
    private String playerGroupName;
    private Long assessorId;
    private String assessorName;
    private LocalDate assessmentDate;
    private AssessmentPeriod period;
    private String comments;
    private String coachNotes;
    private Boolean isFinalized;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SkillScoreResponse> skillScores;
    private Map<SkillCategory, Double> categoryAverages;
    private Double overallAverage;
    private Integer totalSkillsAssessed;
    private Boolean isPartialAssessment;
    
    // Inner class for skill score details
    public static class SkillScoreResponse {
        private Long id;
        private Long skillId;
        private String skillName;
        private SkillCategory skillCategory;
        private Integer score;
        private String notes;
        private Integer previousScore;
        private Integer improvement;
        private String scoreDescription;
        
        // Constructors
        public SkillScoreResponse() {}
        
        public SkillScoreResponse(Long id, Long skillId, String skillName, SkillCategory skillCategory, 
                                Integer score, String notes, Integer previousScore, Integer improvement) {
            this.id = id;
            this.skillId = skillId;
            this.skillName = skillName;
            this.skillCategory = skillCategory;
            this.score = score;
            this.notes = notes;
            this.previousScore = previousScore;
            this.improvement = improvement;
            this.scoreDescription = getScoreDescriptionText(score);
        }
        
        private String getScoreDescriptionText(Integer score) {
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
        
        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public Long getSkillId() { return skillId; }
        public void setSkillId(Long skillId) { this.skillId = skillId; }
        
        public String getSkillName() { return skillName; }
        public void setSkillName(String skillName) { this.skillName = skillName; }
        
        public SkillCategory getSkillCategory() { return skillCategory; }
        public void setSkillCategory(SkillCategory skillCategory) { this.skillCategory = skillCategory; }
        
        public Integer getScore() { return score; }
        public void setScore(Integer score) { 
            this.score = score; 
            this.scoreDescription = getScoreDescriptionText(score);
        }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        
        public Integer getPreviousScore() { return previousScore; }
        public void setPreviousScore(Integer previousScore) { this.previousScore = previousScore; }
        
        public Integer getImprovement() { return improvement; }
        public void setImprovement(Integer improvement) { this.improvement = improvement; }
        
        public String getScoreDescription() { return scoreDescription; }
        public void setScoreDescription(String scoreDescription) { this.scoreDescription = scoreDescription; }
    }
    
    // Constructors
    public AssessmentResponse() {}
    
    public AssessmentResponse(Long id, Long playerId, String playerName, Long assessorId, 
                            String assessorName, LocalDate assessmentDate, AssessmentPeriod period) {
        this.id = id;
        this.playerId = playerId;
        this.playerName = playerName;
        this.assessorId = assessorId;
        this.assessorName = assessorName;
        this.assessmentDate = assessmentDate;
        this.period = period;
    }
    
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
    
    public String getPlayerGroupName() {
        return playerGroupName;
    }
    
    public void setPlayerGroupName(String playerGroupName) {
        this.playerGroupName = playerGroupName;
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
    
    public List<SkillScoreResponse> getSkillScores() {
        return skillScores;
    }
    
    public void setSkillScores(List<SkillScoreResponse> skillScores) {
        this.skillScores = skillScores;
    }
    
    public Map<SkillCategory, Double> getCategoryAverages() {
        return categoryAverages;
    }
    
    public void setCategoryAverages(Map<SkillCategory, Double> categoryAverages) {
        this.categoryAverages = categoryAverages;
    }
    
    public Double getOverallAverage() {
        return overallAverage;
    }
    
    public void setOverallAverage(Double overallAverage) {
        this.overallAverage = overallAverage;
    }
    
    public Integer getTotalSkillsAssessed() {
        return totalSkillsAssessed;
    }
    
    public void setTotalSkillsAssessed(Integer totalSkillsAssessed) {
        this.totalSkillsAssessed = totalSkillsAssessed;
    }
    
    public Boolean getIsPartialAssessment() {
        return isPartialAssessment;
    }
    
    public void setIsPartialAssessment(Boolean isPartialAssessment) {
        this.isPartialAssessment = isPartialAssessment;
    }
}