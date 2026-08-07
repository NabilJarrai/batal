package com.batal.service;

import com.batal.dto.AssessmentTemplateRequest;
import com.batal.dto.AssessmentTemplateResponse;
import com.batal.dto.SkillResponse;
import com.batal.entity.AssessmentTemplate;
import com.batal.entity.Group;
import com.batal.entity.Player;
import com.batal.entity.Skill;
import com.batal.exception.BusinessRuleException;
import com.batal.exception.ResourceAlreadyExistsException;
import com.batal.exception.ResourceNotFoundException;
import com.batal.repository.AssessmentTemplateRepository;
import com.batal.repository.PlayerRepository;
import com.batal.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Manages assessment templates: the named sets of skills that decide what a
 * group's players are scored on.
 */
@Service
@Transactional
public class AssessmentTemplateService {

    @Autowired
    private AssessmentTemplateRepository templateRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Transactional(readOnly = true)
    public List<AssessmentTemplateResponse> getAllTemplates(boolean activeOnly) {
        List<AssessmentTemplate> templates = activeOnly
                ? templateRepository.findActiveWithSkills()
                : templateRepository.findAllWithSkills();
        return templates.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssessmentTemplateResponse getTemplateById(Long id) {
        return toResponse(requireTemplate(id));
    }

    /**
     * The template a given player will be assessed against, inherited from
     * their group.
     *
     * Fails with a message the coach can act on rather than returning an empty
     * list, because an empty skill list is indistinguishable from a template
     * that genuinely has none.
     */
    @Transactional(readOnly = true)
    public AssessmentTemplateResponse getTemplateForPlayer(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", playerId));

        Group group = player.getGroup();
        if (group == null) {
            throw new BusinessRuleException(
                    player.getFullName() + " is not in a group, so there is no assessment template to use. "
                            + "Assign them to a group first.");
        }

        AssessmentTemplate template = group.getAssessmentTemplate();
        if (template == null) {
            throw new BusinessRuleException(
                    "Group \"" + group.getName() + "\" has no assessment template assigned, "
                            + "so its players cannot be assessed yet. "
                            + "Assign one by editing the group.");
        }

        return toResponse(template);
    }

    public AssessmentTemplateResponse createTemplate(AssessmentTemplateRequest request) {
        String title = request.getTitle().trim();
        if (templateRepository.existsByTitleIgnoreCase(title)) {
            throw new ResourceAlreadyExistsException("Assessment template", "title", title);
        }

        AssessmentTemplate template = new AssessmentTemplate();
        template.setTitle(title);
        template.setDescription(trimToNull(request.getDescription()));
        template.setSkills(resolveSkills(request.getSkillIds()));
        template.setIsActive(request.getIsActive() == null || request.getIsActive());

        return toResponse(templateRepository.save(template));
    }

    public AssessmentTemplateResponse updateTemplate(Long id, AssessmentTemplateRequest request) {
        AssessmentTemplate template = requireTemplate(id);

        String title = request.getTitle().trim();
        if (!template.getTitle().equalsIgnoreCase(title)
                && templateRepository.existsByTitleIgnoreCase(title)) {
            throw new ResourceAlreadyExistsException("Assessment template", "title", title);
        }

        boolean deactivating = request.getIsActive() != null && !request.getIsActive();
        if (deactivating) {
            // Deactivating a template that groups still point at would block
            // their assessments with no obvious cause.
            requireNotInUse(template, "deactivated");
        }

        template.setTitle(title);
        template.setDescription(trimToNull(request.getDescription()));
        template.setSkills(resolveSkills(request.getSkillIds()));
        template.setIsActive(request.getIsActive() == null || request.getIsActive());

        return toResponse(templateRepository.save(template));
    }

    public void deleteTemplate(Long id) {
        AssessmentTemplate template = requireTemplate(id);
        requireNotInUse(template, "deleted");
        templateRepository.delete(template);
    }

    /** Skills, in the order given, rejecting unknown or inactive ones. */
    private Set<Skill> resolveSkills(List<Long> skillIds) {
        List<Long> distinctIds = skillIds.stream().distinct().collect(Collectors.toList());

        Map<Long, Skill> found = skillRepository.findAllById(distinctIds).stream()
                .collect(Collectors.toMap(Skill::getId, Function.identity()));

        List<Long> missing = distinctIds.stream()
                .filter(skillId -> !found.containsKey(skillId))
                .collect(Collectors.toList());
        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException("Skill", missing.get(0));
        }

        List<String> inactive = found.values().stream()
                .filter(skill -> !Boolean.TRUE.equals(skill.getIsActive()))
                .map(Skill::getName)
                .collect(Collectors.toList());
        if (!inactive.isEmpty()) {
            throw new BusinessRuleException(
                    "These skills are inactive and cannot be assessed: " + String.join(", ", inactive));
        }

        // Order here is not significant: the entity reads skills back in the
        // library's own order so a skill sits in the same place everywhere.
        return distinctIds.stream()
                .map(found::get)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void requireNotInUse(AssessmentTemplate template, String action) {
        List<String> groups = templateRepository.findAssignedGroupNames(template.getId());
        if (!groups.isEmpty()) {
            throw new BusinessRuleException(
                    "\"" + template.getTitle() + "\" cannot be " + action
                            + " while it is assigned to " + groups.size() + " group(s): "
                            + String.join(", ", groups)
                            + ". Assign those groups a different template first.");
        }
    }

    private AssessmentTemplate requireTemplate(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment template", id));
    }

    private AssessmentTemplateResponse toResponse(AssessmentTemplate template) {
        AssessmentTemplateResponse response = new AssessmentTemplateResponse();
        response.setId(template.getId());
        response.setTitle(template.getTitle());
        response.setDescription(template.getDescription());
        response.setIsActive(template.getIsActive());

        List<SkillResponse> skills = new ArrayList<>();
        for (Skill skill : template.getSkills()) {
            SkillResponse skillResponse = new SkillResponse();
            skillResponse.setId(skill.getId());
            skillResponse.setName(skill.getName());
            skillResponse.setCategory(skill.getCategory());
            skillResponse.setApplicableLevels(skill.getApplicableLevels());
            skillResponse.setDescription(skill.getDescription());
            skillResponse.setDisplayOrder(skill.getDisplayOrder());
            skillResponse.setIsActive(skill.getIsActive());
            skills.add(skillResponse);
        }
        response.setSkills(skills);
        response.setAssignedGroupNames(templateRepository.findAssignedGroupNames(template.getId()));
        response.setCreatedAt(template.getCreatedAt());
        response.setUpdatedAt(template.getUpdatedAt());
        return response;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
