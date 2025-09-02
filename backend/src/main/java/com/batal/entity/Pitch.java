package com.batal.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "pitches")
public class Pitch {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;
    
    @Size(max = 500)
    @Column(length = 500)
    private String description;
    
    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer zones = 1;
    
    @Size(max = 255)
    @Column(length = 255)
    private String location;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "pitch", fetch = FetchType.LAZY)
    private Set<Group> assignedGroups = new HashSet<>();
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Pitch() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Pitch(String name, String description, Integer zones) {
        this();
        this.name = name;
        this.description = description;
        this.zones = zones;
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getZones() {
        return zones;
    }
    
    public void setZones(Integer zones) {
        this.zones = zones;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public Set<Group> getAssignedGroups() {
        return assignedGroups;
    }
    
    public void setAssignedGroups(Set<Group> assignedGroups) {
        this.assignedGroups = assignedGroups;
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
    public void addGroup(Group group) {
        assignedGroups.add(group);
        group.setPitch(this);
    }
    
    public void removeGroup(Group group) {
        assignedGroups.remove(group);
        group.setPitch(null);
    }
    
    public int getAssignedGroupsCount() {
        return assignedGroups.size();
    }
    
    public boolean hasAvailableZones() {
        return getAssignedGroupsCount() < zones;
    }
    
    public int getAvailableZones() {
        return Math.max(0, zones - getAssignedGroupsCount());
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Pitch)) return false;
        Pitch pitch = (Pitch) o;
        return id != null && id.equals(pitch.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Pitch{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", zones=" + zones +
                ", assignedGroups=" + getAssignedGroupsCount() +
                ", isActive=" + isActive +
                '}';
    }
}
