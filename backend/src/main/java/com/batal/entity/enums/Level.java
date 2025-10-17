package com.batal.entity.enums;

public enum Level {
    DEVELOPMENT("Development"),
    ADVANCED("Advanced");
    
    private final String displayName;
    
    Level(String displayName) {
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
