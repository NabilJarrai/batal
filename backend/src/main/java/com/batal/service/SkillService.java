package com.batal.service;

import com.batal.dto.SkillCreateRequest;
import com.batal.dto.SkillOrderRequest;
import com.batal.dto.SkillResponse;
import com.batal.dto.SkillUpdateRequest;
import com.batal.entity.Skill;
import com.batal.entity.User;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.SkillCategory;
import com.batal.entity.enums.UserType;
import com.batal.exception.AccessDeniedException;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.exception.ValidationException;
import com.batal.repository.SkillRepository;
import com.batal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserRepository userRepository;

    // CRUD Operations
    public SkillResponse createSkill(SkillCreateRequest request, Long adminId) {
        validateAdminPermission(adminId);
        validateSkillData(request);
        checkDuplicateSkill(request.getName(), request.getCategory());

        Skill skill = new Skill();
        skill.setName(request.getName());
        skill.setCategory(request.getCategory());
        skill.setApplicableLevel(request.getApplicableLevel());
        skill.setDescription(request.getDescription());
        skill.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        // Set display order
        if (request.getDisplayOrder() != null) {
            skill.setDisplayOrder(request.getDisplayOrder());
        } else {
            // Auto-assign next order in category
            Integer maxOrder = skillRepository.findMaxDisplayOrderByCategory(request.getCategory()).orElse(0);
            skill.setDisplayOrder(maxOrder + 1);
        }

        Skill savedSkill = skillRepository.save(skill);
        return convertToResponse(savedSkill);
    }

    public SkillResponse updateSkill(Long skillId, SkillUpdateRequest request, Long adminId) {
        validateAdminPermission(adminId);
        
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", skillId));
        
        // Check if skill is used in assessments for certain restrictions
        // Future enhancement: Could restrict certain changes if skill is used in assessments
        
        // Update allowed fields
        if (request.getName() != null && !request.getName().equals(skill.getName())) {
            // Check for duplicates in the same category
            if (skillRepository.existsByNameAndCategoryAndIdNot(request.getName(), skill.getCategory(), skillId)) {
                throw new ResourceAlreadyExistsException("Skill with name '" + request.getName() + "' already exists in category " + skill.getCategory());
            }
            skill.setName(request.getName());
        }
        
        if (request.getDescription() != null) {
            skill.setDescription(request.getDescription());
        }
        
        if (request.getDisplayOrder() != null) {
            skill.setDisplayOrder(request.getDisplayOrder());
        }
        
        if (request.getIsActive() != null) {
            skill.setIsActive(request.getIsActive());
        }

        Skill updatedSkill = skillRepository.save(skill);
        return convertToResponse(updatedSkill);
    }

    public void deleteSkill(Long skillId, Long adminId) {
        validateAdminPermission(adminId);
        
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", skillId));
        
        if (!canDeleteSkill(skillId)) {
            throw new BusinessRuleException("Cannot delete skill '" + skill.getName() + "' as it is used in assessments. Consider marking it as inactive instead.");
        }

        skillRepository.delete(skill);
    }

    @Transactional(readOnly = true)
    public SkillResponse getSkillById(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + skillId));
        return convertToResponse(skill);
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> getAllSkills() {
        // Get all skills
        List<Skill> skills = skillRepository.findAllByOrderByCategoryAscDisplayOrderAsc();
        
        // Get all usage counts in a single query to avoid N+1 problem
        Map<Long, Long> usageCounts = new HashMap<>();
        List<Object[]> counts = skillRepository.findAllSkillUsageCounts();
        for (Object[] row : counts) {
            Long skillId = (Long) row[0];
            Long count = (Long) row[1];
            usageCounts.put(skillId, count);
        }
        
        // Convert to responses with cached usage counts
        return skills.stream()
                .map(skill -> convertToResponseWithUsageCount(skill, usageCounts.getOrDefault(skill.getId(), 0L)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> getSkillsByCategory(SkillCategory category) {
        return skillRepository.findByCategoryOrderByDisplayOrderAsc(category)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> getSkillsByLevel(Level level) {
        return skillRepository.findByApplicableLevelOrderByDisplayOrderAsc(level)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> getActiveSkills() {
        return skillRepository.findActiveSkillsOrderedByCategoryAndDisplay()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> getSkillsByCategoryAndLevel(SkillCategory category, Level level) {
        return skillRepository.findByCategoryAndApplicableLevelAndIsActiveTrue(category, level)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Page<SkillResponse> getAllSkillsPaginated(SkillCategory category, Level level, 
                                                     boolean activeOnly, Pageable pageable) {
        Specification<Skill> spec = Specification.where(null);
        
        if (category != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        
        if (level != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("applicableLevel"), level));
        }
        
        if (activeOnly) {
            spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isActive")));
        }
        
        Page<Skill> skillPage = skillRepository.findAll(spec, pageable);
        return skillPage.map(this::convertToResponse);
    }

    public List<SkillResponse> bulkCreateSkills(List<SkillCreateRequest> requests, Long adminId) {
        validateAdminPermission(adminId);
        
        List<SkillResponse> results = new ArrayList<>();
        for (SkillCreateRequest request : requests) {
            try {
                results.add(createSkill(request, adminId));
            } catch (Exception e) {
                // Log error but continue with other skills
                System.err.println("Failed to create skill " + request.getName() + ": " + e.getMessage());
            }
        }
        return results;
    }

    public void reorderSkills(List<SkillOrderRequest> reorderRequests, Long adminId) {
        validateAdminPermission(adminId);
        
        for (SkillOrderRequest request : reorderRequests) {
            Skill skill = skillRepository.findById(request.getSkillId())
                    .orElseThrow(() -> new RuntimeException("Skill not found with id: " + request.getSkillId()));
            
            skill.setDisplayOrder(request.getNewOrder());
            skillRepository.save(skill);
        }
    }

    public void initializeDefaultSkills(Long adminId) {
        validateAdminPermission(adminId);
        
        List<SkillCreateRequest> defaultSkills = getDefaultSkills();
        
        // Only create if no skills exist yet
        if (skillRepository.count() == 0) {
            bulkCreateSkills(defaultSkills, adminId);
        } else {
            throw new BusinessRuleException("Skills already exist. Cannot initialize default skills.");
        }
    }

    // Admin Permission Validation (Private)
    private void validateAdminPermission(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        
        if (!hasAdminRole(user)) {
            throw new AccessDeniedException("manage", "skills");
        }
    }

    private boolean hasAdminRole(User user) {
        return user.getUserType() == UserType.ADMIN || 
               (user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName())));
    }

    private boolean canDeleteSkill(Long skillId) {
        return skillRepository.countAssessmentsBySkillId(skillId) == 0;
    }

    private void validateSkillData(SkillCreateRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("name", "Skill name is required");
        }
        if (request.getCategory() == null) {
            throw new ValidationException("category", "Skill category is required");
        }
        if (request.getApplicableLevel() == null) {
            throw new ValidationException("applicableLevel", "Applicable level is required");
        }
    }

    private void checkDuplicateSkill(String name, SkillCategory category) {
        if (skillRepository.existsByNameAndCategory(name, category)) {
            throw new ResourceAlreadyExistsException("Skill with name '" + name + "' already exists in category " + category);
        }
    }

    // Conversion Methods
    private SkillResponse convertToResponse(Skill skill) {
        SkillResponse response = new SkillResponse();
        response.setId(skill.getId());
        response.setName(skill.getName());
        response.setCategory(skill.getCategory());
        response.setApplicableLevel(skill.getApplicableLevel());
        response.setDescription(skill.getDescription());
        response.setDisplayOrder(skill.getDisplayOrder());
        response.setIsActive(skill.getIsActive());
        response.setCreatedAt(skill.getCreatedAt());
        response.setUpdatedAt(skill.getUpdatedAt());
        
        // Set usage information
        long usageCount = skillRepository.countAssessmentsBySkillId(skill.getId());
        response.setUsageCount(usageCount);
        response.setCanDelete(usageCount == 0);
        
        return response;
    }
    
    // Helper method to convert entity to response DTO with cached usage count
    private SkillResponse convertToResponseWithUsageCount(Skill skill, Long usageCount) {
        SkillResponse response = new SkillResponse();
        response.setId(skill.getId());
        response.setName(skill.getName());
        response.setCategory(skill.getCategory());
        response.setApplicableLevel(skill.getApplicableLevel());
        response.setDescription(skill.getDescription());
        response.setDisplayOrder(skill.getDisplayOrder());
        response.setIsActive(skill.getIsActive());
        response.setCreatedAt(skill.getCreatedAt());
        response.setUpdatedAt(skill.getUpdatedAt());
        
        // Use cached usage count
        response.setUsageCount(usageCount);
        response.setCanDelete(usageCount == 0);
        
        return response;
    }

    // Default Skills Configuration
    private List<SkillCreateRequest> getDefaultSkills() {
        List<SkillCreateRequest> skills = new ArrayList<>();
        
        // Athletic Skills (4 skills)
        skills.add(new SkillCreateRequest("General Motor Skills", SkillCategory.ATHLETIC, Level.DEVELOPMENT, "Basic movement and coordination abilities"));
        skills.add(new SkillCreateRequest("Strength", SkillCategory.ATHLETIC, Level.DEVELOPMENT, "Physical strength and power"));
        skills.add(new SkillCreateRequest("Running", SkillCategory.ATHLETIC, Level.DEVELOPMENT, "Running technique and endurance"));
        skills.add(new SkillCreateRequest("Speed", SkillCategory.ATHLETIC, Level.DEVELOPMENT, "Sprint speed and acceleration"));
        
        // Technical Skills (5 skills)
        skills.add(new SkillCreateRequest("Receiving/Control", SkillCategory.TECHNICAL, Level.DEVELOPMENT, "Ball control and first touch"));
        skills.add(new SkillCreateRequest("Passing", SkillCategory.TECHNICAL, Level.DEVELOPMENT, "Short and long passing accuracy"));
        skills.add(new SkillCreateRequest("Dribbling", SkillCategory.TECHNICAL, Level.DEVELOPMENT, "Ball control while moving"));
        skills.add(new SkillCreateRequest("Shooting", SkillCategory.TECHNICAL, Level.DEVELOPMENT, "Finishing and shot accuracy"));
        skills.add(new SkillCreateRequest("Defending", SkillCategory.TECHNICAL, Level.DEVELOPMENT, "Tackling and defensive positioning"));
        
        // Mentality Skills (3 skills)
        skills.add(new SkillCreateRequest("Technical Player", SkillCategory.MENTALITY, Level.DEVELOPMENT, "Technical decision making"));
        skills.add(new SkillCreateRequest("Team Player", SkillCategory.MENTALITY, Level.DEVELOPMENT, "Teamwork and collaboration"));
        skills.add(new SkillCreateRequest("Game IQ", SkillCategory.MENTALITY, Level.DEVELOPMENT, "Game understanding and intelligence"));
        
        // Personality Skills (4 skills)
        skills.add(new SkillCreateRequest("Discipline", SkillCategory.PERSONALITY, Level.DEVELOPMENT, "Self-control and following instructions"));
        skills.add(new SkillCreateRequest("Coachable", SkillCategory.PERSONALITY, Level.DEVELOPMENT, "Receptiveness to feedback and instruction"));
        skills.add(new SkillCreateRequest("Flair", SkillCategory.PERSONALITY, Level.DEVELOPMENT, "Creativity and flair in play"));
        skills.add(new SkillCreateRequest("Creativity", SkillCategory.PERSONALITY, Level.DEVELOPMENT, "Creative thinking and problem solving"));
        
        // Set display orders
        for (int i = 0; i < skills.size(); i++) {
            skills.get(i).setDisplayOrder(i + 1);
        }
        
        return skills;
    }
}