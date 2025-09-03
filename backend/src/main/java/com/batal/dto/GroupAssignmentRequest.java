package com.batal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class GroupAssignmentRequest {
    
    @NotNull(message = "Player ID is required")
    private Long playerId;
    
    @NotNull(message = "Group ID is required")
    private Long groupId;
    
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
    
    private Boolean forceAssignment = false; // Override capacity/age restrictions
    
    // Constructors
    public GroupAssignmentRequest() {}
    
    public GroupAssignmentRequest(Long playerId, Long groupId) {
        this.playerId = playerId;
        this.groupId = groupId;
    }
    
    public GroupAssignmentRequest(Long playerId, Long groupId, String reason) {
        this.playerId = playerId;
        this.groupId = groupId;
        this.reason = reason;
    }
    
    // Getters and Setters
    public Long getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }
    
    public Long getGroupId() {
        return groupId;
    }
    
    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public Boolean getForceAssignment() {
        return forceAssignment;
    }
    
    public void setForceAssignment(Boolean forceAssignment) {
        this.forceAssignment = forceAssignment;
    }
}