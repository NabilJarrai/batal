package com.batal.entity.enums;

public enum MembershipStatus {
    ACTIVE("Active"),
    EXPIRED("Expired"),
    SUSPENDED("Suspended"),
    CANCELLED("Cancelled");
    
    private final String displayName;
    
    MembershipStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    @Override
    public String toString() {
        return displayName;
    }
}
