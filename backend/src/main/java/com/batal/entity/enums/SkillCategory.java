package com.batal.entity.enums;

public enum SkillCategory {
    ATHLETIC("Athletic"),
    TECHNICAL("Technical"),
    MENTALITY("Mentality"),
    PERSONALITY("Personality");
    
    private final String displayName;
    
    SkillCategory(String displayName) {
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
