package com.batal.dto;

public class UserStatusUpdateRequest {
    
    private Boolean isActive;
    private String inactiveReason;
    
    // Default constructor
    public UserStatusUpdateRequest() {}
    
    public UserStatusUpdateRequest(Boolean isActive, String inactiveReason) {
        this.isActive = isActive;
        this.inactiveReason = inactiveReason;
    }
    
    // Getters and Setters
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getInactiveReason() {
        return inactiveReason;
    }
    
    public void setInactiveReason(String inactiveReason) {
        this.inactiveReason = inactiveReason;
    }
}
