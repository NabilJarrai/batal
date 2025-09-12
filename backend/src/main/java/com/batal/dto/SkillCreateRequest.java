package com.batal.dto;

import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.Set;

public class SkillCreateRequest {
    
    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must not exceed 100 characters")
    private String name;
    
    @NotNull(message = "Skill category is required")
    private SkillCategory category;
    
    @NotEmpty(message = "At least one applicable level is required")
    private Set<Level> applicableLevels = new HashSet<>();
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private Integer displayOrder = 0;
    
    private Boolean isActive = true;
    
    // Constructors
    public SkillCreateRequest() {}
    
    public SkillCreateRequest(String name, SkillCategory category, Set<Level> applicableLevels) {
        this.name = name;
        this.category = category;
        this.applicableLevels = applicableLevels != null ? applicableLevels : new HashSet<>();
    }
    
    public SkillCreateRequest(String name, SkillCategory category, Set<Level> applicableLevels, String description) {
        this(name, category, applicableLevels);
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
    
    public Set<Level> getApplicableLevels() {
        return applicableLevels;
    }
    
    public void setApplicableLevels(Set<Level> applicableLevels) {
        this.applicableLevels = applicableLevels;
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
                ", applicableLevels=" + applicableLevels +
                ", description='" + description + '\'' +
                ", displayOrder=" + displayOrder +
                ", isActive=" + isActive +
                '}';
    }
}