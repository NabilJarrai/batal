package com.batal.entity.enums;

public enum AgeGroup {
    COOKIES("Cookies", 4, 6),
    DOLPHINS("Dolphins", 7, 10),
    TIGERS("Tigers", 11, 13),
    LIONS("Lions", 14, 16);
    
    private final String displayName;
    private final int minAge;
    private final int maxAge;
    
    AgeGroup(String displayName, int minAge, int maxAge) {
        this.displayName = displayName;
        this.minAge = minAge;
        this.maxAge = maxAge;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getMinAge() {
        return minAge;
    }
    
    public int getMaxAge() {
        return maxAge;
    }
    
    public static AgeGroup getByAge(int age) {
        for (AgeGroup group : values()) {
            if (age >= group.minAge && age <= group.maxAge) {
                return group;
            }
        }
        return null;
    }
    
    @Override
    public String toString() {
        return displayName;
    }
}
