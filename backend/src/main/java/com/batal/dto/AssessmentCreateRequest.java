package com.batal.dto;

import com.batal.entity.enums.AssessmentPeriod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public class AssessmentCreateRequest {
    
    @NotNull(message = "Player ID is required")
    private Long playerId;
    
    @NotNull(message = "Assessment date is required")
    @PastOrPresent(message = "Assessment date cannot be in the future")
    private LocalDate assessmentDate;
    
    @NotNull(message = "Assessment period is required")
    private AssessmentPeriod period;
    
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String comments;
    
    @Size(max = 1000, message = "Coach notes cannot exceed 1000 characters")
    private String coachNotes;
    
    @NotNull(message = "Skill ratings are required")
    @NotEmpty(message = "At least one skill rating is required")
    @Valid
    private List<SkillRatingRequest> skillRatings;
    
    private Boolean isFinalized = false;
    
    // Constructors
    public AssessmentCreateRequest() {}
    
    public AssessmentCreateRequest(Long playerId, LocalDate assessmentDate, AssessmentPeriod period, 
                                 List<SkillRatingRequest> skillRatings) {
        this.playerId = playerId;
        this.assessmentDate = assessmentDate;
        this.period = period;
        this.skillRatings = skillRatings;
    }
    
    // Getters and Setters
    public Long getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
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
    
    public List<SkillRatingRequest> getSkillRatings() {
        return skillRatings;
    }
    
    public void setSkillRatings(List<SkillRatingRequest> skillRatings) {
        this.skillRatings = skillRatings;
    }
    
    public Boolean getIsFinalized() {
        return isFinalized;
    }
    
    public void setIsFinalized(Boolean isFinalized) {
        this.isFinalized = isFinalized;
    }
}