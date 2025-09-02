package com.batal.service;

import com.batal.dto.UserResponse;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<UserResponse> getUsersByRole(String roleName) {
        List<User> users = userRepository.findAllByRoleName(roleName);
        return users.stream()
                .map(user -> new UserResponse(user, user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList())))
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(user, roles);
    }

    public UserResponse updateUser(Long id, UserResponse userResponse) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update user fields
        if (userResponse.getFirstName() != null) {
            user.setFirstName(userResponse.getFirstName());
        }
        if (userResponse.getLastName() != null) {
            user.setLastName(userResponse.getLastName());
        }
        if (userResponse.getPhone() != null) {
            user.setPhone(userResponse.getPhone());
        }
        if (userResponse.getDateOfBirth() != null) {
            user.setDateOfBirth(userResponse.getDateOfBirth());
        }
        if (userResponse.getGender() != null) {
            user.setGender(userResponse.getGender());
        }
        if (userResponse.getAddress() != null) {
            user.setAddress(userResponse.getAddress());
        }
        if (userResponse.getEmergencyContactName() != null) {
            user.setEmergencyContactName(userResponse.getEmergencyContactName());
        }
        if (userResponse.getEmergencyContactPhone() != null) {
            user.setEmergencyContactPhone(userResponse.getEmergencyContactPhone());
        }

        User savedUser = userRepository.save(user);
        List<String> roles = savedUser.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
        return new UserResponse(savedUser, roles);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        userRepository.save(user);
    }

    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);
    }
}
