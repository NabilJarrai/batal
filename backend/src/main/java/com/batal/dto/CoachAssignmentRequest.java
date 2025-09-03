package com.batal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CoachAssignmentRequest {
    
    @NotNull(message = "Coach ID is required")
    private Long coachId;
    
    @NotNull(message = "Group ID is required")
    private Long groupId;
    
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
    
    // Constructors
    public CoachAssignmentRequest() {}
    
    public CoachAssignmentRequest(Long coachId, Long groupId) {
        this.coachId = coachId;
        this.groupId = groupId;
    }
    
    public CoachAssignmentRequest(Long coachId, Long groupId, String notes) {
        this.coachId = coachId;
        this.groupId = groupId;
        this.notes = notes;
    }
    
    // Getters and Setters
    public Long getCoachId() {
        return coachId;
    }
    
    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }
    
    public Long getGroupId() {
        return groupId;
    }
    
    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
}