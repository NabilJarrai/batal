package com.batal.dto;

import com.batal.entity.enums.SkillCategory;
import java.time.LocalDate;
import java.util.List;

public class LatestSkillScoresResponse {

    private boolean isFirstAssessment;
    private LocalDate lastAssessmentDate;
    private List<SkillScoreEntry> skillScores;

    public LatestSkillScoresResponse() {}

    public LatestSkillScoresResponse(boolean isFirstAssessment, LocalDate lastAssessmentDate,
                                     List<SkillScoreEntry> skillScores) {
        this.isFirstAssessment = isFirstAssessment;
        this.lastAssessmentDate = lastAssessmentDate;
        this.skillScores = skillScores;
    }

    public static class SkillScoreEntry {
        private Long skillId;
        private String skillName;
        private SkillCategory skillCategory;
        private int score;
        private String notes;

        public SkillScoreEntry() {}

        public SkillScoreEntry(Long skillId, String skillName, SkillCategory skillCategory,
                               int score, String notes) {
            this.skillId = skillId;
            this.skillName = skillName;
            this.skillCategory = skillCategory;
            this.score = score;
            this.notes = notes;
        }

        public Long getSkillId() { return skillId; }
        public void setSkillId(Long skillId) { this.skillId = skillId; }

        public String getSkillName() { return skillName; }
        public void setSkillName(String skillName) { this.skillName = skillName; }

        public SkillCategory getSkillCategory() { return skillCategory; }
        public void setSkillCategory(SkillCategory skillCategory) { this.skillCategory = skillCategory; }

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // Getters and Setters
    public boolean getIsFirstAssessment() { return isFirstAssessment; }
    public void setIsFirstAssessment(boolean isFirstAssessment) { this.isFirstAssessment = isFirstAssessment; }

    public LocalDate getLastAssessmentDate() { return lastAssessmentDate; }
    public void setLastAssessmentDate(LocalDate lastAssessmentDate) { this.lastAssessmentDate = lastAssessmentDate; }

    public List<SkillScoreEntry> getSkillScores() { return skillScores; }
    public void setSkillScores(List<SkillScoreEntry> skillScores) { this.skillScores = skillScores; }
}
