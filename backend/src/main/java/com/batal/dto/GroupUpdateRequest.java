package com.batal.dto;

import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class GroupUpdateRequest {
    
    private Level level;
    
    private AgeGroup ageGroup;
    
    @Min(value = 1, message = "Group number must be at least 1")
    private Integer groupNumber;
    
    @Min(value = 5, message = "Capacity must be at least 5")
    private Integer capacity;
    
    private Long coachId;
    
    private Long pitchId;
    
    @Size(max = 50, message = "Zone cannot exceed 50 characters")
    private String zone;
    
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
    
    private Boolean isActive;
    
    // Constructors
    public GroupUpdateRequest() {}
    
    // Getters and Setters
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
    
    public Integer getGroupNumber() {
        return groupNumber;
    }
    
    public void setGroupNumber(Integer groupNumber) {
        this.groupNumber = groupNumber;
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
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}