package com.batal.service;

import com.batal.dto.*;
import com.batal.entity.*;
import com.batal.entity.enums.*;
import com.batal.exception.AccessDeniedException;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ValidationException;
import com.batal.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssessmentService {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private SkillScoreRepository skillScoreRepository;

    // ===== CREATE OPERATIONS =====

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public AssessmentResponse createAssessment(AssessmentCreateRequest request) {
        // Get current authenticated user
        User currentUser = getCurrentAuthenticatedUser();

        // Find the player
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new EntityNotFoundException("Player not found with ID: " + request.getPlayerId()));

        // Validate permissions - Coaches can only assess players in their groups
        validateCoachCanAssessPlayer(currentUser, player.getUser());

        // Check for duplicate assessments in the same month
        validateNoDuplicateAssessment(player.getUser(), request.getAssessmentDate(), null);

        // Validate skills belong to player's level
        validateSkillsForPlayerLevel(request.getSkillRatings(), player.getUser().getLevel());

        // Create assessment
        Assessment assessment = new Assessment();
        assessment.setPlayer(player);
        assessment.setAssessor(currentUser);
        assessment.setAssessmentDate(request.getAssessmentDate());
        assessment.setPeriod(request.getPeriod());
        assessment.setComments(request.getComments());
        assessment.setCoachNotes(request.getCoachNotes());
        assessment.setIsFinalized(request.getIsFinalized() != null ? request.getIsFinalized() : false);

        assessment = assessmentRepository.save(assessment);

        // Create skill scores
        createSkillScores(assessment, request.getSkillRatings());

        return convertToAssessmentResponse(assessment);
    }

    // ===== READ OPERATIONS =====

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public AssessmentResponse getAssessmentById(Long assessmentId) {
        Assessment assessment = findAssessmentById(assessmentId);
        User currentUser = getCurrentAuthenticatedUser();

        // Validate permissions
        validateCanViewAssessment(currentUser, assessment);

        return convertToAssessmentResponse(assessment);
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public List<AssessmentResponse> getAssessmentsByPlayerId(Long playerId) {
        User currentUser = getCurrentAuthenticatedUser();
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not found with ID: " + playerId));

        // Validate permissions
        validateCanViewPlayerAssessments(currentUser, player.getUser());

        List<Assessment> assessments = assessmentRepository.findByPlayerIdOrderByAssessmentDateDesc(playerId);
        return assessments.stream()
                .map(this::convertToAssessmentResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public List<AssessmentResponse> getAssessmentsByCoachId(Long coachId) {
        User currentUser = getCurrentAuthenticatedUser();

        // Validate permissions - Coaches can only view their own assessments unless admin/manager
        if (hasRole(currentUser, "COACH") && !currentUser.getId().equals(coachId)) {
            throw new SecurityException("Coaches can only view their own assessments");
        }

        // Verify coach exists
        userRepository.findById(coachId)
                .orElseThrow(() -> new EntityNotFoundException("Coach not found with ID: " + coachId));

        List<Assessment> assessments = assessmentRepository.findByAssessorIdOrderByAssessmentDateDesc(coachId);
        return assessments.stream()
                .map(this::convertToAssessmentResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public List<AssessmentResponse> getAssessmentsByDateRange(LocalDate startDate, LocalDate endDate) {
        User currentUser = getCurrentAuthenticatedUser();
        List<Assessment> assessments;

        if (hasRole(currentUser, "COACH")) {
            // Coaches can only see assessments for players in their groups
            assessments = assessmentRepository.findByDateRangeAndCoach(startDate, endDate, currentUser);
        } else {
            // Admins and Managers can see all assessments
            assessments = assessmentRepository.findByAssessmentDateBetween(startDate, endDate);
        }

        return assessments.stream()
                .map(this::convertToAssessmentResponse)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public List<AssessmentResponse> getMyAssessments() {
        User currentUser = getCurrentAuthenticatedUser();
        
        if (hasRole(currentUser, "COACH")) {
            List<Assessment> assessments = assessmentRepository.findByPlayerGroupCoach(currentUser);
            return assessments.stream()
                    .map(this::convertToAssessmentResponse)
                    .collect(Collectors.toList());
        } else {
            // For admins/managers, return all assessments
            List<Assessment> assessments = assessmentRepository.findAllByOrderByAssessmentDateDesc();
            return assessments.stream()
                    .map(this::convertToAssessmentResponse)
                    .collect(Collectors.toList());
        }
    }

    // ===== UPDATE OPERATIONS =====

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public AssessmentResponse updateAssessment(Long assessmentId, AssessmentUpdateRequest request) {
        Assessment assessment = findAssessmentById(assessmentId);
        User currentUser = getCurrentAuthenticatedUser();

        // Validate permissions
        validateCanEditAssessment(currentUser, assessment);

        // Check if assessment is finalized (only admins can edit finalized assessments)
        if (assessment.getIsFinalized() && !hasRole(currentUser, "ADMIN")) {
            throw new IllegalStateException("Cannot edit finalized assessment");
        }

        // Validate no duplicate if date is being changed
        if (request.getAssessmentDate() != null && 
            !request.getAssessmentDate().equals(assessment.getAssessmentDate())) {
            validateNoDuplicateAssessment(assessment.getPlayer().getUser(), request.getAssessmentDate(), assessmentId);
        }

        // Update fields
        updateAssessmentFields(assessment, request);

        // Update skill scores if provided
        if (request.getSkillRatings() != null) {
            validateSkillsForPlayerLevel(request.getSkillRatings(), assessment.getPlayer().getUser().getLevel());
            updateSkillScores(assessment, request.getSkillRatings());
        }

        assessment = assessmentRepository.save(assessment);
        return convertToAssessmentResponse(assessment);
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public AssessmentResponse finalizeAssessment(Long assessmentId) {
        Assessment assessment = findAssessmentById(assessmentId);
        User currentUser = getCurrentAuthenticatedUser();

        // Validate permissions
        validateCanEditAssessment(currentUser, assessment);

        if (assessment.getIsFinalized()) {
            throw new IllegalStateException("Assessment is already finalized");
        }

        // Allow partial assessments - just log a warning if incomplete
        if (!isAssessmentComplete(assessment)) {
            // Log warning but don't block finalization
            System.out.println("Warning: Finalizing partial assessment for player " + 
                              assessment.getPlayer().getFirstName() + " " + 
                              assessment.getPlayer().getLastName() + 
                              " - Not all skills have been assessed");
        }

        assessment.setIsFinalized(true);
        assessment = assessmentRepository.save(assessment);

        return convertToAssessmentResponse(assessment);
    }

    // ===== DELETE OPERATIONS =====

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public void deleteAssessment(Long assessmentId) {
        Assessment assessment = findAssessmentById(assessmentId);
        User currentUser = getCurrentAuthenticatedUser();

        // Check ownership - coaches can only delete their own assessments
        if (hasRole(currentUser, "COACH") && !hasRole(currentUser, "ADMIN") && !hasRole(currentUser, "MANAGER")) {
            if (!assessment.getAssessor().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("delete", "assessment");
            }
        }

        // Only allow deletion of non-finalized assessments or by admins
        if (assessment.getIsFinalized() && !hasRole(currentUser, "ADMIN")) {
            throw new BusinessRuleException("Cannot delete finalized assessment");
        }

        assessmentRepository.delete(assessment);
    }

    // ===== ANALYTICS OPERATIONS =====

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public Map<String, Object> getPlayerProgressAnalytics(Long playerId) {
        User currentUser = getCurrentAuthenticatedUser();
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not found with ID: " + playerId));

        validateCanViewPlayerAssessments(currentUser, player.getUser());

        List<Assessment> assessments = assessmentRepository.findByPlayerIdOrderByAssessmentDateDesc(playerId);
        
        Map<String, Object> analytics = new HashMap<>();
        
        if (assessments.isEmpty()) {
            analytics.put("totalAssessments", 0);
            analytics.put("averageScore", 0.0);
            analytics.put("categoryAverages", new HashMap<>());
            analytics.put("progressTrend", "No data available");
            return analytics;
        }

        // Calculate overall statistics
        double overallAverage = assessments.stream()
                .mapToDouble(Assessment::getAverageScore)
                .average()
                .orElse(0.0);

        // Calculate category averages
        Map<SkillCategory, Double> categoryAverages = Arrays.stream(SkillCategory.values())
                .collect(Collectors.toMap(
                    category -> category,
                    category -> assessments.stream()
                        .mapToDouble(a -> a.getCategoryAverageScore(category))
                        .filter(score -> score > 0)
                        .average()
                        .orElse(0.0)
                ));

        // Calculate improvement trend (comparing latest vs earliest)
        String progressTrend = "Stable";
        if (assessments.size() > 1) {
            double latestAverage = assessments.get(0).getAverageScore();
            double earliestAverage = assessments.get(assessments.size() - 1).getAverageScore();
            double improvement = latestAverage - earliestAverage;
            
            if (improvement > 0.5) {
                progressTrend = "Improving";
            } else if (improvement < -0.5) {
                progressTrend = "Declining";
            }
        }

        analytics.put("totalAssessments", assessments.size());
        analytics.put("averageScore", Math.round(overallAverage * 100.0) / 100.0);
        analytics.put("categoryAverages", categoryAverages);
        analytics.put("progressTrend", progressTrend);
        analytics.put("latestAssessmentDate", assessments.get(0).getAssessmentDate());
        
        return analytics;
    }

    @PreAuthorize("hasRole('COACH') or hasRole('ADMIN') or hasRole('MANAGER')")
    public AssessmentSummaryResponse getAssessmentSummary(Long playerId, Long groupId, String period, 
                                                          LocalDate dateFrom, LocalDate dateTo) {
        User currentUser = getCurrentAuthenticatedUser();
        
        // Build query based on filters
        List<Assessment> assessments;
        
        if (hasRole(currentUser, "COACH")) {
            // Coaches can only see assessments for players in their groups
            assessments = assessmentRepository.findByPlayerGroupCoach(currentUser);
        } else {
            // Admins/Managers see all assessments
            assessments = assessmentRepository.findAll();
        }
        
        // Apply filters
        if (playerId != null) {
            assessments = assessments.stream()
                    .filter(a -> a.getPlayer().getId().equals(playerId))
                    .collect(Collectors.toList());
        }
        
        if (groupId != null) {
            assessments = assessments.stream()
                    .filter(a -> a.getPlayer().getUser().getGroup() != null && 
                                 a.getPlayer().getUser().getGroup().getId().equals(groupId))
                    .collect(Collectors.toList());
        }
        
        if (period != null) {
            AssessmentPeriod assessmentPeriod = AssessmentPeriod.valueOf(period.toUpperCase());
            assessments = assessments.stream()
                    .filter(a -> a.getPeriod() == assessmentPeriod)
                    .collect(Collectors.toList());
        }
        
        if (dateFrom != null) {
            assessments = assessments.stream()
                    .filter(a -> !a.getAssessmentDate().isBefore(dateFrom))
                    .collect(Collectors.toList());
        }
        
        if (dateTo != null) {
            assessments = assessments.stream()
                    .filter(a -> !a.getAssessmentDate().isAfter(dateTo))
                    .collect(Collectors.toList());
        }
        
        // Calculate summary statistics
        int totalAssessments = assessments.size();
        
        long completedCount = assessments.stream()
                .filter(Assessment::getIsFinalized)
                .count();
        int completedAssessments = (int) completedCount;
        int pendingAssessments = totalAssessments - completedAssessments;
        
        // Calculate average score by category
        Map<SkillCategory, Double> categoryAverages = new HashMap<>();
        for (SkillCategory category : SkillCategory.values()) {
            double average = assessments.stream()
                    .flatMap(a -> a.getSkillScores().stream())
                    .filter(ss -> ss.getSkill().getCategory() == category)
                    .mapToInt(SkillScore::getScore)
                    .average()
                    .orElse(0.0);
            categoryAverages.put(category, Math.round(average * 100.0) / 100.0);
        }
        
        return new AssessmentSummaryResponse(
            totalAssessments,
            completedAssessments,
            pendingAssessments,
            categoryAverages
        );
    }

    // ===== HELPER METHODS =====

    private Assessment findAssessmentById(Long assessmentId) {
        return assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assessment not found with ID: " + assessmentId));
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase(roleName));
    }

    private void validateCoachCanAssessPlayer(User coach, User player) {
        if (hasRole(coach, "ADMIN") || hasRole(coach, "MANAGER")) {
            return; // Admins and managers can assess any player
        }

        if (hasRole(coach, "COACH")) {
            // Check if player has a group assigned
            if (player.getGroup() == null) {
                throw new IllegalStateException("Cannot assess player: Player is not assigned to any group. Please assign the player to a group first.");
            }

            // Check if group has a coach assigned
            if (player.getGroup().getCoach() == null) {
                throw new IllegalStateException("Cannot assess player: Player's group has no assigned coach. Please assign a coach to the group first.");
            }

            // Check if the current coach is authorized to assess this player
            if (!coach.equals(player.getGroup().getCoach())) {
                throw new SecurityException("Coach can only assess players in their assigned groups");
            }
        } else {
            throw new SecurityException("User does not have permission to create assessments");
        }
    }

    private void validateCanViewAssessment(User user, Assessment assessment) {
        if (hasRole(user, "ADMIN") || hasRole(user, "MANAGER")) {
            return; // Admins and managers can view all assessments
        }

        if (hasRole(user, "COACH")) {
            // First check: Coach can view their own assessments regardless of group assignment
            if (user.equals(assessment.getAssessor())) {
                return;
            }

            // Second check: Coach can view assessments for players in their groups (if properly assigned)
            if (assessment.getPlayer() != null &&
                assessment.getPlayer().getUser() != null &&
                assessment.getPlayer().getUser().getGroup() != null &&
                assessment.getPlayer().getUser().getGroup().getCoach() != null &&
                user.equals(assessment.getPlayer().getUser().getGroup().getCoach())) {
                return;
            }
        }

        throw new SecurityException("Access denied to view this assessment");
    }

    private void validateCanViewPlayerAssessments(User user, User player) {
        if (hasRole(user, "ADMIN") || hasRole(user, "MANAGER")) {
            return; // Admins and managers can view all player assessments
        }
        
        if (hasRole(user, "COACH")) {
            if (player.getGroup() != null && user.equals(player.getGroup().getCoach())) {
                return;
            }
        }
        
        throw new SecurityException("Access denied to view assessments for this player");
    }

    private void validateCanEditAssessment(User user, Assessment assessment) {
        if (hasRole(user, "ADMIN") || hasRole(user, "MANAGER")) {
            return; // Admins and managers can edit all assessments
        }

        if (hasRole(user, "COACH")) {
            // First check: Coach can edit their own assessments regardless of group assignment
            if (user.getId().equals(assessment.getAssessor().getId())) {
                return;
            }

            // Second check: Coach can edit assessments for players in their groups (if properly assigned)
            if (assessment.getPlayer() != null &&
                assessment.getPlayer().getUser() != null &&
                assessment.getPlayer().getUser().getGroup() != null &&
                assessment.getPlayer().getUser().getGroup().getCoach() != null &&
                user.getId().equals(assessment.getPlayer().getUser().getGroup().getCoach().getId())) {
                return;
            }
        }

        throw new SecurityException("Access denied to edit this assessment");
    }

    private void validateNoDuplicateAssessment(User player, LocalDate assessmentDate, Long excludeAssessmentId) {
        int year = assessmentDate.getYear();
        int month = assessmentDate.getMonthValue();
        
        boolean exists;
        if (excludeAssessmentId != null) {
            exists = assessmentRepository.existsByPlayerIdAndYearAndMonthAndIdNot(
                player.getId(), year, month, excludeAssessmentId);
        } else {
            exists = assessmentRepository.existsByPlayerIdAndYearAndMonth(
                player.getId(), year, month);
        }
        
        if (exists) {
            throw new IllegalStateException(
                "An assessment already exists for this player in " + 
                assessmentDate.getMonth() + " " + year);
        }
    }

    private void validateSkillsForPlayerLevel(List<SkillRatingRequest> skillRatings, Level playerLevel) {
        List<Long> skillIds = skillRatings.stream()
                .map(SkillRatingRequest::getSkillId)
                .collect(Collectors.toList());

        List<Skill> skills = skillRepository.findAllById(skillIds);
        
        if (skills.size() != skillIds.size()) {
            throw new EntityNotFoundException("One or more skills not found");
        }

        for (Skill skill : skills) {
            if (!skill.isApplicableForLevel(playerLevel)) {
                throw new ValidationException(
                    "Skill '" + skill.getName() + "' is not applicable for " + playerLevel + " level");
            }
            if (!skill.getIsActive()) {
                throw new ValidationException(
                    "Skill '" + skill.getName() + "' is not active");
            }
        }
    }

    private boolean isAssessmentComplete(Assessment assessment) {
        Level playerLevel = assessment.getPlayer().getUser().getLevel();
        List<Skill> requiredSkills = skillRepository.findByApplicableLevelsContainingAndIsActiveTrue(playerLevel);
        
        Set<Long> assessedSkillIds = assessment.getSkillScores().stream()
                .map(ss -> ss.getSkill().getId())
                .collect(Collectors.toSet());

        List<String> missingSkills = requiredSkills.stream()
                .filter(skill -> !assessedSkillIds.contains(skill.getId()))
                .map(Skill::getName)
                .collect(Collectors.toList());

        return missingSkills.isEmpty();
    }
    
    private void validateAssessmentComplete(Assessment assessment) {
        if (!isAssessmentComplete(assessment)) {
            Level playerLevel = assessment.getPlayer().getUser().getLevel();
            List<Skill> requiredSkills = skillRepository.findByApplicableLevelsContainingAndIsActiveTrue(playerLevel);
            
            Set<Long> assessedSkillIds = assessment.getSkillScores().stream()
                    .map(ss -> ss.getSkill().getId())
                    .collect(Collectors.toSet());

            List<String> missingSkills = requiredSkills.stream()
                    .filter(skill -> !assessedSkillIds.contains(skill.getId()))
                    .map(Skill::getName)
                    .collect(Collectors.toList());
                    
            throw new IllegalStateException(
                "Assessment is incomplete. Missing skills: " + String.join(", ", missingSkills));
        }
    }

    private void createSkillScores(Assessment assessment, List<SkillRatingRequest> skillRatings) {
        for (SkillRatingRequest rating : skillRatings) {
            Skill skill = skillRepository.findById(rating.getSkillId())
                    .orElseThrow(() -> new EntityNotFoundException("Skill not found with ID: " + rating.getSkillId()));

            // Get previous score if exists
            Integer previousScore = getPreviousSkillScore(assessment.getPlayer().getUser(), skill);

            SkillScore skillScore = new SkillScore();
            skillScore.setAssessment(assessment);
            skillScore.setSkill(skill);
            skillScore.setScore(rating.getScore());
            skillScore.setNotes(rating.getNotes());
            skillScore.setPreviousScore(previousScore);

            assessment.addSkillScore(skillScore);
        }
    }

    private void updateSkillScores(Assessment assessment, List<SkillRatingRequest> skillRatings) {
        // Create a map of existing skill scores by skill ID for efficient lookup
        Map<Long, SkillScore> existingScoresBySkillId = assessment.getSkillScores().stream()
                .collect(Collectors.toMap(ss -> ss.getSkill().getId(), ss -> ss));

        // Create a set to track which skill scores we've processed
        Set<Long> processedSkillIds = new HashSet<>();

        // Update or create skill scores
        for (SkillRatingRequest rating : skillRatings) {
            Skill skill = skillRepository.findById(rating.getSkillId())
                    .orElseThrow(() -> new EntityNotFoundException("Skill not found with ID: " + rating.getSkillId()));

            processedSkillIds.add(skill.getId());

            if (existingScoresBySkillId.containsKey(skill.getId())) {
                // Update existing skill score
                SkillScore existingScore = existingScoresBySkillId.get(skill.getId());
                existingScore.setScore(rating.getScore());
                existingScore.setNotes(rating.getNotes());
            } else {
                // Create new skill score
                Integer previousScore = getPreviousSkillScore(assessment.getPlayer().getUser(), skill);

                SkillScore skillScore = new SkillScore();
                skillScore.setAssessment(assessment);
                skillScore.setSkill(skill);
                skillScore.setScore(rating.getScore());
                skillScore.setNotes(rating.getNotes());
                skillScore.setPreviousScore(previousScore);

                assessment.addSkillScore(skillScore);
            }
        }

        // Remove skill scores that are no longer in the request
        List<SkillScore> scoresToRemove = assessment.getSkillScores().stream()
                .filter(ss -> !processedSkillIds.contains(ss.getSkill().getId()))
                .collect(Collectors.toList());

        for (SkillScore scoreToRemove : scoresToRemove) {
            assessment.getSkillScores().remove(scoreToRemove);
            skillScoreRepository.delete(scoreToRemove);
        }
    }

    private Integer getPreviousSkillScore(User player, Skill skill) {
        // TODO: Update SkillScoreRepository to work with User entities
        // For now, return null - previous scores will be calculated differently
        return null;
    }

    private void updateAssessmentFields(Assessment assessment, AssessmentUpdateRequest request) {
        if (request.getAssessmentDate() != null) {
            assessment.setAssessmentDate(request.getAssessmentDate());
        }
        if (request.getPeriod() != null) {
            assessment.setPeriod(request.getPeriod());
        }
        if (request.getComments() != null) {
            assessment.setComments(request.getComments());
        }
        if (request.getCoachNotes() != null) {
            assessment.setCoachNotes(request.getCoachNotes());
        }
        if (request.getIsFinalized() != null) {
            assessment.setIsFinalized(request.getIsFinalized());
        }
    }

    private AssessmentResponse convertToAssessmentResponse(Assessment assessment) {
        AssessmentResponse response = new AssessmentResponse();
        response.setId(assessment.getId());
        response.setPlayerId(assessment.getPlayer().getId());
        response.setPlayerName(assessment.getPlayer().getFullName());
        response.setPlayerGroupName(assessment.getPlayer().getUser().getGroup() != null ? 
                assessment.getPlayer().getUser().getGroup().getName() : null);
        response.setAssessorId(assessment.getAssessor().getId());
        response.setAssessorName(assessment.getAssessor().getFullName());
        response.setAssessmentDate(assessment.getAssessmentDate());
        response.setPeriod(assessment.getPeriod());
        response.setComments(assessment.getComments());
        response.setCoachNotes(assessment.getCoachNotes());
        response.setIsFinalized(assessment.getIsFinalized());
        response.setCreatedAt(assessment.getCreatedAt());
        response.setUpdatedAt(assessment.getUpdatedAt());

        // Convert skill scores
        List<AssessmentResponse.SkillScoreResponse> skillScoreResponses = assessment.getSkillScores()
                .stream()
                .map(this::convertToSkillScoreResponse)
                .sorted(Comparator.comparing((AssessmentResponse.SkillScoreResponse ss) -> ss.getSkillCategory().toString())
                        .thenComparing(AssessmentResponse.SkillScoreResponse::getSkillName))
                .collect(Collectors.toList());

        response.setSkillScores(skillScoreResponses);

        // Calculate statistics
        response.setOverallAverage(assessment.getAverageScore());
        response.setTotalSkillsAssessed(assessment.getSkillScores().size());

        // Calculate category averages
        Map<SkillCategory, Double> categoryAverages = Arrays.stream(SkillCategory.values())
                .collect(Collectors.toMap(
                    category -> category,
                    category -> assessment.getCategoryAverageScore(category)
                ));
        response.setCategoryAverages(categoryAverages);
        
        // Check if assessment is partial
        response.setIsPartialAssessment(!isAssessmentComplete(assessment));

        return response;
    }

    private AssessmentResponse.SkillScoreResponse convertToSkillScoreResponse(SkillScore skillScore) {
        return new AssessmentResponse.SkillScoreResponse(
                skillScore.getId(),
                skillScore.getSkill().getId(),
                skillScore.getSkill().getName(),
                skillScore.getSkill().getCategory(),
                skillScore.getScore(),
                skillScore.getNotes(),
                skillScore.getPreviousScore(),
                skillScore.getImprovement()
        );
    }
}