package com.batal.dto;

import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import java.time.LocalDateTime;

public class SkillResponse {
    
    private Long id;
    private String name;
    private SkillCategory category;
    private Level applicableLevel;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private Boolean canDelete; // false if skill is used in assessments
    private Long usageCount; // how many skill scores use this skill
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public SkillResponse() {}
    
    public SkillResponse(Long id, String name, SkillCategory category, Level applicableLevel) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.applicableLevel = applicableLevel;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public Boolean getCanDelete() {
        return canDelete;
    }
    
    public void setCanDelete(Boolean canDelete) {
        this.canDelete = canDelete;
    }
    
    public Long getUsageCount() {
        return usageCount;
    }
    
    public void setUsageCount(Long usageCount) {
        this.usageCount = usageCount;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Utility methods
    public String getCategoryDisplayName() {
        if (category == null) return null;
        return category.name().substring(0, 1) + category.name().substring(1).toLowerCase();
    }
    
    public String getLevelDisplayName() {
        if (applicableLevel == null) return null;
        return applicableLevel.name().substring(0, 1) + applicableLevel.name().substring(1).toLowerCase();
    }
    
    @Override
    public String toString() {
        return "SkillResponse{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", category=" + category +
                ", applicableLevel=" + applicableLevel +
                ", isActive=" + isActive +
                ", canDelete=" + canDelete +
                ", usageCount=" + usageCount +
                '}';
    }
}