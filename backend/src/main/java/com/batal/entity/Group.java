package com.batal.entity;

import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "groups", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"level", "age_group", "group_number"}))
public class Group {
    
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
    private Level level;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", nullable = false, length = 20)
    private AgeGroup ageGroup;
    
    @NotNull
    @Min(1)
    @Column(name = "group_number", nullable = false)
    private Integer groupNumber = 1;
    
    @NotNull
    @Min(4)
    @Column(name = "min_age", nullable = false)
    private Integer minAge;
    
    @NotNull
    @Min(4)
    @Column(name = "max_age", nullable = false)
    private Integer maxAge;
    
    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer capacity = 15;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private User coach;
    
    @OneToMany(mappedBy = "group", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<User> players = new HashSet<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pitch_id")
    private Pitch pitch;
    
    @Size(max = 50)
    @Column(length = 50)
    private String zone;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Group() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Group(Level level, AgeGroup ageGroup, Integer groupNumber) {
        this();
        this.level = level;
        this.ageGroup = ageGroup;
        this.groupNumber = groupNumber;
        this.name = generateGroupName();
        this.minAge = ageGroup.getMinAge();
        this.maxAge = ageGroup.getMaxAge();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    private String generateGroupName() {
        String suffix = groupNumber > 1 ? " " + groupNumber : "";
        return level.getDisplayName() + " " + ageGroup.getDisplayName() + suffix;
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
    
    public Level getLevel() {
        return level;
    }
    
    public void setLevel(Level level) {
        this.level = level;
        if (this.ageGroup != null && this.groupNumber != null) {
            this.name = generateGroupName();
        }
    }
    
    public AgeGroup getAgeGroup() {
        return ageGroup;
    }
    
    public void setAgeGroup(AgeGroup ageGroup) {
        this.ageGroup = ageGroup;
        this.minAge = ageGroup.getMinAge();
        this.maxAge = ageGroup.getMaxAge();
        if (this.level != null && this.groupNumber != null) {
            this.name = generateGroupName();
        }
    }
    
    public Integer getGroupNumber() {
        return groupNumber;
    }
    
    public void setGroupNumber(Integer groupNumber) {
        this.groupNumber = groupNumber;
        if (this.level != null && this.ageGroup != null) {
            this.name = generateGroupName();
        }
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
    
    public Integer getCapacity() {
        return capacity;
    }
    
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
    
    public User getCoach() {
        return coach;
    }
    
    public void setCoach(User coach) {
        this.coach = coach;
    }
    
    public Set<User> getPlayers() {
        return players;
    }
    
    public void setPlayers(Set<User> players) {
        this.players = players;
    }
    
    public Pitch getPitch() {
        return pitch;
    }
    
    public void setPitch(Pitch pitch) {
        this.pitch = pitch;
    }
    
    public String getZone() {
        return zone;
    }
    
    public void setZone(String zone) {
        this.zone = zone;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    public void addPlayer(User player) {
        players.add(player);
        player.setGroup(this);
    }
    
    public void removePlayer(User player) {
        players.remove(player);
        player.setGroup(null);
    }
    
    public int getCurrentPlayerCount() {
        return players.size();
    }
    
    public boolean isFull() {
        return getCurrentPlayerCount() >= capacity;
    }
    
    public boolean hasSpace() {
        return getCurrentPlayerCount() < capacity;
    }
    
    public int getAvailableSpots() {
        return Math.max(0, capacity - getCurrentPlayerCount());
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Group)) return false;
        Group group = (Group) o;
        return id != null && id.equals(group.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Group{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", level=" + level +
                ", ageGroup=" + ageGroup +
                ", playerCount=" + getCurrentPlayerCount() +
                ", capacity=" + capacity +
                '}';
    }
}
