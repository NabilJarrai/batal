package com.batal.dto;

import jakarta.validation.constraints.NotNull;

public class SkillOrderRequest {
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    @NotNull(message = "New order is required")
    private Integer newOrder;
    
    // Constructors
    public SkillOrderRequest() {}
    
    public SkillOrderRequest(Long skillId, Integer newOrder) {
        this.skillId = skillId;
        this.newOrder = newOrder;
    }
    
    // Getters and Setters
    public Long getSkillId() {
        return skillId;
    }
    
    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }
    
    public Integer getNewOrder() {
        return newOrder;
    }
    
    public void setNewOrder(Integer newOrder) {
        this.newOrder = newOrder;
    }
    
    @Override
    public String toString() {
        return "SkillOrderRequest{" +
                "skillId=" + skillId +
                ", newOrder=" + newOrder +
                '}';
    }
}