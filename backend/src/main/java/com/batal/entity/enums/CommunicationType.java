package com.batal.entity.enums;

public enum CommunicationType {
    COMMENT("Comment"),
    COMPLAINT("Complaint"),
    INQUIRY("Inquiry"),
    FEEDBACK("Feedback");
    
    private final String displayName;
    
    CommunicationType(String displayName) {
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
