package com.batal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Create or update an assessment template.
 *
 * Carries no age or level: both describe the group, and a template reaches
 * players only by being assigned to one.
 */
public class AssessmentTemplateRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    /**
     * The skills to assess, in the order they should be scored. A template
     * with no skills would block every assessment for its groups, so at least
     * one is required.
     */
    @NotEmpty(message = "Pick at least one skill")
    private List<Long> skillIds;

    private Boolean isActive = true;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Long> getSkillIds() { return skillIds; }
    public void setSkillIds(List<Long> skillIds) { this.skillIds = skillIds; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
