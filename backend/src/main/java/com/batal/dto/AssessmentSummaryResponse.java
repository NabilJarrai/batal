package com.batal.dto;

import com.batal.entity.enums.SkillCategory;
import java.util.Map;

public class AssessmentSummaryResponse {
    
    private Integer totalAssessments;
    private Integer completedAssessments;
    private Integer pendingAssessments;
    private Map<SkillCategory, Double> averageScoreByCategory;
    
    // Constructors
    public AssessmentSummaryResponse() {}
    
    public AssessmentSummaryResponse(Integer totalAssessments, Integer completedAssessments, 
                                    Integer pendingAssessments, Map<SkillCategory, Double> averageScoreByCategory) {
        this.totalAssessments = totalAssessments;
        this.completedAssessments = completedAssessments;
        this.pendingAssessments = pendingAssessments;
        this.averageScoreByCategory = averageScoreByCategory;
    }
    
    // Getters and Setters
    public Integer getTotalAssessments() {
        return totalAssessments;
    }
    
    public void setTotalAssessments(Integer totalAssessments) {
        this.totalAssessments = totalAssessments;
    }
    
    public Integer getCompletedAssessments() {
        return completedAssessments;
    }
    
    public void setCompletedAssessments(Integer completedAssessments) {
        this.completedAssessments = completedAssessments;
    }
    
    public Integer getPendingAssessments() {
        return pendingAssessments;
    }
    
    public void setPendingAssessments(Integer pendingAssessments) {
        this.pendingAssessments = pendingAssessments;
    }
    
    public Map<SkillCategory, Double> getAverageScoreByCategory() {
        return averageScoreByCategory;
    }
    
    public void setAverageScoreByCategory(Map<SkillCategory, Double> averageScoreByCategory) {
        this.averageScoreByCategory = averageScoreByCategory;
    }
}