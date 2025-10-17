package com.batal.entity;

import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "skills", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"name"}))
public class Skill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SkillCategory category;
    
    @NotEmpty
    @ElementCollection(targetClass = Level.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "skill_applicable_levels", 
                     joinColumns = @JoinColumn(name = "skill_id"))
    @Column(name = "level", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<Level> applicableLevels = new HashSet<>();
    
    @Size(max = 500)
    @Column(length = 500)
    private String description;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "skill", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<SkillScore> skillScores = new HashSet<>();
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Skill() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Skill(String name, SkillCategory category, Set<Level> applicableLevels) {
        this();
        this.name = name;
        this.category = category;
        this.applicableLevels = applicableLevels != null ? applicableLevels : new HashSet<>();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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
    
    public Set<SkillScore> getSkillScores() {
        return skillScores;
    }
    
    public void setSkillScores(Set<SkillScore> skillScores) {
        this.skillScores = skillScores;
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
    public boolean isApplicableForLevel(Level level) {
        return this.applicableLevels != null && this.applicableLevels.contains(level);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Skill)) return false;
        Skill skill = (Skill) o;
        return id != null && id.equals(skill.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Skill{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", category=" + category +
                ", applicableLevels=" + applicableLevels +
                ", isActive=" + isActive +
                '}';
    }
}
