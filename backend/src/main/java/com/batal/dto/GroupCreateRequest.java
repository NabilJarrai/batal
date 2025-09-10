package com.batal.dto;

import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class GroupCreateRequest {
    
    @NotBlank(message = "Group name is required")
    @Size(max = 100, message = "Group name cannot exceed 100 characters")
    private String name;
    
    @NotNull(message = "Level is required")
    private Level level;
    
    @NotNull(message = "Age group is required")
    private AgeGroup ageGroup;
    
    @Min(value = 5, message = "Capacity must be at least 5")
    private Integer capacity = 15;
    
    private Long coachId;
    
    private Long pitchId;
    
    @Size(max = 50, message = "Zone cannot exceed 50 characters")
    private String zone;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    // Optional: Override default age range from AgeGroup
    @Min(value = 4, message = "Minimum age must be at least 4")
    private Integer minAge;
    
    @Min(value = 4, message = "Maximum age must be at least 4")
    private Integer maxAge;
    
    // Constructors
    public GroupCreateRequest() {}
    
    public GroupCreateRequest(String name, Level level, AgeGroup ageGroup) {
        this.name = name;
        this.level = level;
        this.ageGroup = ageGroup;
    }
    
    public GroupCreateRequest(Level level, AgeGroup ageGroup) {
        this.level = level;
        this.ageGroup = ageGroup;
        // Name will be set separately for auto-assignment
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Level getLevel() {
        return level;
    }
    
    public void setLevel(Level level) {
        this.level = level;
    }
    
    public AgeGroup getAgeGroup() {
        return ageGroup;
    }
    
    public void setAgeGroup(AgeGroup ageGroup) {
        this.ageGroup = ageGroup;
    }
    
    public Integer getCapacity() {
        return capacity;
    }
    
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
    
    public Long getCoachId() {
        return coachId;
    }
    
    public void setCoachId(Long coachId) {
        this.coachId = coachId;
    }
    
    public Long getPitchId() {
        return pitchId;
    }
    
    public void setPitchId(Long pitchId) {
        this.pitchId = pitchId;
    }
    
    public String getZone() {
        return zone;
    }
    
    public void setZone(String zone) {
        this.zone = zone;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getMinAge() {
        return minAge;
    }
    
    public void setMinAge(Integer minAge) {
        this.minAge = minAge;
    }
    
    public Integer getMaxAge() {
        return maxAge;
    }
    
    public void setMaxAge(Integer maxAge) {
        this.maxAge = maxAge;
    }
}