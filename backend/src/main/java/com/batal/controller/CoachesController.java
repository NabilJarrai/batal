package com.batal.controller;

import com.batal.dto.UserResponse;
import com.batal.dto.UserUpdateRequest;
import com.batal.service.UserService;
import com.batal.service.CoachesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coaches")
@CrossOrigin(origins = "*")
public class CoachesController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private CoachesService coachesService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllCoaches() {
        List<UserResponse> coaches = userService.getUsersByRole("COACH");
        return ResponseEntity.ok(coaches);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or (hasRole('COACH') and #id == authentication.principal.id)")
    public ResponseEntity<UserResponse> getCoachById(@PathVariable Long id) {
        UserResponse coach = userService.getUserById(id);
        return ResponseEntity.ok(coach);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('COACH') and #id == authentication.principal.id)")
    public ResponseEntity<UserResponse> updateCoach(@PathVariable Long id, @RequestBody UserUpdateRequest userDTO) {
        UserResponse updatedCoach = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedCoach);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCoach(@PathVariable Long id) {
        coachesService.deleteCoach(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Coach deleted successfully and removed from all assigned groups");
        return ResponseEntity.ok(response);
    }
}
