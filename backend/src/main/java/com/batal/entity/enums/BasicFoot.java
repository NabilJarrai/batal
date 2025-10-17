package com.batal.entity.enums;

public enum BasicFoot {
    LEFT("Left"),
    RIGHT("Right");
    
    private final String displayName;
    
    BasicFoot(String displayName) {
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
