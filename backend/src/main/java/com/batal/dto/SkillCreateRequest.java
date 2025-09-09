package com.batal.dto;

import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SkillCreateRequest {
    
    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must not exceed 100 characters")
    private String name;
    
    @NotNull(message = "Skill category is required")
    private SkillCategory category;
    
    @NotNull(message = "Applicable level is required")
    private Level applicableLevel;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private Integer displayOrder = 0;
    
    private Boolean isActive = true;
    
    // Constructors
    public SkillCreateRequest() {}
    
    public SkillCreateRequest(String name, SkillCategory category, Level applicableLevel) {
        this.name = name;
        this.category = category;
        this.applicableLevel = applicableLevel;
    }
    
    public SkillCreateRequest(String name, SkillCategory category, Level applicableLevel, String description) {
        this(name, category, applicableLevel);
        this.description = description;
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public SkillCategory getCategory() {
        return category;
    }
    
    public void setCategory(SkillCategory category) {
        this.category = category;
    }
    
    public Level getApplicableLevel() {
        return applicableLevel;
    }
    
    public void setApplicableLevel(Level applicableLevel) {
        this.applicableLevel = applicableLevel;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    @Override
    public String toString() {
        return "SkillCreateRequest{" +
                "name='" + name + '\'' +
                ", category=" + category +
                ", applicableLevel=" + applicableLevel +
                ", description='" + description + '\'' +
                ", displayOrder=" + displayOrder +
                ", isActive=" + isActive +
                '}';
    }
}