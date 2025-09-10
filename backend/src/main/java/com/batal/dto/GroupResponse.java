package com.batal.dto;

import com.batal.entity.Group;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class GroupResponse {
    
    private Long id;
    private String name;
    private Level level;
    private AgeGroup ageGroup;
    private Integer minAge;
    private Integer maxAge;
    private Integer capacity;
    private Integer currentPlayerCount;
    private Integer availableSpots;
    private Boolean isFull;
    private String zone;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Coach information
    private UserResponse coach;
    
    // Pitch information
    private Long pitchId;
    private String pitchName;
    
    // Player information
    private List<PlayerDTO> players;
    
    // Constructors
    public GroupResponse() {}
    
    public GroupResponse(Group group) {
        this.id = group.getId();
        this.name = group.getName();
        this.level = group.getLevel();
        this.ageGroup = group.getAgeGroup();
        this.minAge = group.getMinAge();
        this.maxAge = group.getMaxAge();
        this.capacity = group.getCapacity();
        this.currentPlayerCount = group.getCurrentPlayerCount();
        this.availableSpots = group.getAvailableSpots();
        this.isFull = group.isFull();
        this.zone = group.getZone();
        this.description = group.getDescription();
        this.isActive = group.getIsActive();
        this.createdAt = group.getCreatedAt();
        this.updatedAt = group.getUpdatedAt();
        
        // Set coach information if present
        if (group.getCoach() != null) {
            this.coach = new UserResponse(group.getCoach(), 
                group.getCoach().getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList()));
        }
        
        // Set pitch information if present
        if (group.getPitch() != null) {
            this.pitchId = group.getPitch().getId();
            this.pitchName = group.getPitch().getName();
        }
        
        // Set players information - we'll need to convert players to DTOs manually
        // For now, we'll set this to empty list and let the service layer handle player details
        this.players = List.of();
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
    }
    
    public AgeGroup getAgeGroup() {
        return ageGroup;
    }
    
    public void setAgeGroup(AgeGroup ageGroup) {
        this.ageGroup = ageGroup;
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
    
    public Integer getCurrentPlayerCount() {
        return currentPlayerCount;
    }
    
    public void setCurrentPlayerCount(Integer currentPlayerCount) {
        this.currentPlayerCount = currentPlayerCount;
    }
    
    public Integer getAvailableSpots() {
        return availableSpots;
    }
    
    public void setAvailableSpots(Integer availableSpots) {
        this.availableSpots = availableSpots;
    }
    
    public Boolean getIsFull() {
        return isFull;
    }
    
    public void setIsFull(Boolean isFull) {
        this.isFull = isFull;
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
    
    public UserResponse getCoach() {
        return coach;
    }
    
    public void setCoach(UserResponse coach) {
        this.coach = coach;
    }
    
    public Long getPitchId() {
        return pitchId;
    }
    
    public void setPitchId(Long pitchId) {
        this.pitchId = pitchId;
    }
    
    public String getPitchName() {
        return pitchName;
    }
    
    public void setPitchName(String pitchName) {
        this.pitchName = pitchName;
    }
    
    public List<PlayerDTO> getPlayers() {
        return players;
    }
    
    public void setPlayers(List<PlayerDTO> players) {
        this.players = players;
    }
}