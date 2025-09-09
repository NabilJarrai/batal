package com.batal.dto;

import jakarta.validation.constraints.*;

public class SkillRatingRequest {
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be at least 1")
    @Max(value = 10, message = "Score must be at most 10")
    private Integer score;
    
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
    
    private Integer previousScore;
    
    // Constructors
    public SkillRatingRequest() {}
    
    public SkillRatingRequest(Long skillId, Integer score) {
        this.skillId = skillId;
        this.score = score;
    }
    
    public SkillRatingRequest(Long skillId, Integer score, String notes) {
        this.skillId = skillId;
        this.score = score;
        this.notes = notes;
    }
    
    // Getters and Setters
    public Long getSkillId() {
        return skillId;
    }
    
    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
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
    }
    
    @Override
    public String toString() {
        return "SkillRatingRequest{" +
                "skillId=" + skillId +
                ", score=" + score +
                ", notes='" + notes + '\'' +
                ", previousScore=" + previousScore +
                '}';
    }
}