package com.batal.controller;

import com.batal.dto.UserResponse;
import com.batal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coaches")
@CrossOrigin(origins = "*")
public class CoachesController {

    @Autowired
    private UserService userService;

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
    public ResponseEntity<UserResponse> updateCoach(@PathVariable Long id, @RequestBody UserResponse userDTO) {
        UserResponse updatedCoach = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedCoach);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteCoach(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Coach deleted successfully!");
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> activateCoach(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok("Coach activated successfully!");
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deactivateCoach(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok("Coach deactivated successfully!");
    }
}
