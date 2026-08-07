package com.batal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A titled set of skills that defines what a group's players are assessed on.
 *
 * This is the blueprint, not the result: {@link Assessment} holds one player's
 * scored evaluation on a date. Keeping them apart means editing a template
 * never rewrites assessments already recorded against it.
 *
 * Templates carry no age or level of their own. Both already describe the
 * group, and a template reaches players only by being assigned to one.
 */
@Entity
@Table(name = "assessment_templates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"title"}))
public class AssessmentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * The skills this template covers.
     *
     * Ordered by the skill's own position in the library rather than the order
     * they were picked, so the same skill sits in the same place across every
     * template and the scoring form stays predictable. Eagerly fetched because
     * every use of a template needs its skills.
     */
    @NotEmpty
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "assessment_template_skills",
        joinColumns = @JoinColumn(name = "template_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @OrderBy("displayOrder ASC, name ASC")
    private Set<Skill> skills = new LinkedHashSet<>();

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public AssessmentTemplate() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean covers(Skill skill) {
        return skills.contains(skill);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Set<Skill> getSkills() { return skills; }
    public void setSkills(Set<Skill> skills) { this.skills = skills; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AssessmentTemplate)) return false;
        AssessmentTemplate other = (AssessmentTemplate) o;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "AssessmentTemplate{id=" + id + ", title='" + title + "'}";
    }
}
