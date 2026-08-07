package com.batal.dto;

import com.batal.entity.Group;
import com.batal.entity.Player;
import com.batal.entity.enums.AgeGroup;
import com.batal.entity.enums.Level;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.hibernate.Hibernate;

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
    // Assessment template. Null means assessments are blocked for this group's
    // players until one is assigned.
    private Long assessmentTemplateId;
    private String assessmentTemplateTitle;

    private UserResponse coach;

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
        
        // Set assessment template if one is assigned
        if (group.getAssessmentTemplate() != null) {
            this.assessmentTemplateId = group.getAssessmentTemplate().getId();
            this.assessmentTemplateTitle = group.getAssessmentTemplate().getTitle();
        }

        // Set coach information if present
        if (group.getCoach() != null) {
            this.coach = new UserResponse(group.getCoach(),
                group.getCoach().getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toList()));
        }

        // Players, when the caller fetched them. The service layer was meant to
        // fill these in and never did, leaving every group response with an
        // empty list - which silently emptied the card's player list and any
        // picker built on it.
        //
        // Guarded on initialisation rather than always loading: list endpoints
        // page over many groups and would otherwise trigger a query per group.
        // Endpoints that need players use findByIdWithPlayersAndCoach.
        if (Hibernate.isInitialized(group.getPlayers())) {
            this.players = group.getPlayers().stream()
                    .sorted(Comparator.comparing(Player::getFirstName, Comparator.nullsLast(String::compareTo))
                            .thenComparing(Player::getId, Comparator.nullsLast(Long::compareTo)))
                    .map(GroupResponse::toPlayerSummary)
                    .collect(Collectors.toList());
        } else {
            this.players = List.of();
        }
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
    
    public Long getAssessmentTemplateId() {
        return assessmentTemplateId;
    }

    public void setAssessmentTemplateId(Long assessmentTemplateId) {
        this.assessmentTemplateId = assessmentTemplateId;
    }

    public String getAssessmentTemplateTitle() {
        return assessmentTemplateTitle;
    }

    public void setAssessmentTemplateTitle(String assessmentTemplateTitle) {
        this.assessmentTemplateTitle = assessmentTemplateTitle;
    }

    public UserResponse getCoach() {
        return coach;
    }
    
    public void setCoach(UserResponse coach) {
        this.coach = coach;
    }

    public List<PlayerDTO> getPlayers() {
        return players;
    }
    
    public void setPlayers(List<PlayerDTO> players) {
        this.players = players;
    }

    /**
     * Enough of a player to list and act on from a group: identity, age and
     * level. Deliberately not the full PlayerDTO, whose parent lookups would
     * add queries per player.
     */
    private static PlayerDTO toPlayerSummary(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setFirstName(player.getFirstName());
        dto.setLastName(player.getLastName());
        dto.setDateOfBirth(player.getDateOfBirth());
        dto.setLevel(player.getLevel());
        dto.setBasicFoot(player.getBasicFoot());
        dto.setIsActive(player.getIsActive());
        return dto;
    }
}