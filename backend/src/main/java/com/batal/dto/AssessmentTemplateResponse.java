package com.batal.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AssessmentTemplateResponse {

    private Long id;
    private String title;
    private String description;
    private Boolean isActive;
    private List<SkillResponse> skills = new ArrayList<>();
    private Integer skillCount;

    /**
     * Groups currently using this template. Shown so an admin can see the
     * blast radius before editing or retiring it.
     */
    private List<String> assignedGroupNames = new ArrayList<>();
    private Integer assignedGroupCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AssessmentTemplateResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<SkillResponse> getSkills() { return skills; }
    public void setSkills(List<SkillResponse> skills) {
        this.skills = skills;
        this.skillCount = skills != null ? skills.size() : 0;
    }

    public Integer getSkillCount() { return skillCount; }
    public void setSkillCount(Integer skillCount) { this.skillCount = skillCount; }

    public List<String> getAssignedGroupNames() { return assignedGroupNames; }
    public void setAssignedGroupNames(List<String> assignedGroupNames) {
        this.assignedGroupNames = assignedGroupNames;
        this.assignedGroupCount = assignedGroupNames != null ? assignedGroupNames.size() : 0;
    }

    public Integer getAssignedGroupCount() { return assignedGroupCount; }
    public void setAssignedGroupCount(Integer assignedGroupCount) { this.assignedGroupCount = assignedGroupCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
