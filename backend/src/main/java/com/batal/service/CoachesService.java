package com.batal.service;

import com.batal.entity.User;
import com.batal.entity.Group;
import com.batal.exception.ResourceNotFoundException;
import com.batal.exception.BusinessRuleException;
import com.batal.repository.UserRepository;
import com.batal.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CoachesService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private UserService userService;

    /**
     * Delete a coach with proper handling of group assignments
     * @param coachId The ID of the coach to delete
     */
    public void deleteCoach(Long coachId) {
        // Verify the user exists and is a coach
        User coach = userRepository.findByIdWithRoles(coachId)
                .orElseThrow(() -> new ResourceNotFoundException("Coach", coachId));
        
        // Verify user has COACH role
        boolean isCoach = coach.getRoles().stream()
                .anyMatch(role -> "COACH".equals(role.getName()));
        
        if (!isCoach) {
            throw new BusinessRuleException("User with ID " + coachId + " is not a coach");
        }
        
        // Check if coach is assigned to any groups
        List<Group> coachGroups = groupRepository.findByCoachId(coachId);
        
        if (!coachGroups.isEmpty()) {
            // Remove coach from all groups (set coach to null)
            for (Group group : coachGroups) {
                group.setCoach(null);
                groupRepository.save(group);
            }
        }
        
        // Use UserService to delete the user (which includes self-deletion check)
        userService.deleteUser(coachId);
    }
    
    /**
     * Remove coach from a specific group
     * @param coachId The ID of the coach
     * @param groupId The ID of the group
     */
    public void removeCoachFromGroup(Long coachId, Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", groupId));
        
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ResourceNotFoundException("Coach", coachId));
        
        if (group.getCoach() != null && group.getCoach().getId().equals(coachId)) {
            group.setCoach(null);
            groupRepository.save(group);
        }
    }
}