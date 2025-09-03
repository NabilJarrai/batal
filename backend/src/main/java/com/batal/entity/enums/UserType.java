package com.batal.entity.enums;

public enum UserType {
    COACH("Coach"),
    ADMIN("Admin"),
    MANAGER("Manager");
    
    private final String displayName;
    
    UserType(String displayName) {
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
