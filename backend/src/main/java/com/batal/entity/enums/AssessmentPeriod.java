package com.batal.entity.enums;

public enum AssessmentPeriod {
    MONTHLY("Monthly"),
    QUARTERLY("Quarterly");
    
    private final String displayName;
    
    AssessmentPeriod(String displayName) {
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
