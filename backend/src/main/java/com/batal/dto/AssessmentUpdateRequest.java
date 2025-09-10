package com.batal.dto;

import com.batal.entity.enums.AssessmentPeriod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public class AssessmentUpdateRequest {
    
    @PastOrPresent(message = "Assessment date cannot be in the future")
    private LocalDate assessmentDate;
    
    private AssessmentPeriod period;
    
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String comments;
    
    @Size(max = 1000, message = "Coach notes cannot exceed 1000 characters")
    private String coachNotes;
    
    @Valid
    private List<SkillRatingRequest> skillRatings;
    
    private Boolean isFinalized;
    
    // Constructors
    public AssessmentUpdateRequest() {}
    
    public AssessmentUpdateRequest(LocalDate assessmentDate, AssessmentPeriod period, 
                                 String comments, String coachNotes) {
        this.assessmentDate = assessmentDate;
        this.period = period;
        this.comments = comments;
        this.coachNotes = coachNotes;
    }
    
    // Getters and Setters
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
    
    // Helper method to check if any field is being updated
    public boolean hasUpdates() {
        return assessmentDate != null || period != null || comments != null || 
               coachNotes != null || skillRatings != null || isFinalized != null;
    }
}