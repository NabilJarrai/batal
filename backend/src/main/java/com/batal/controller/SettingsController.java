package com.batal.controller;

import com.batal.dto.ParentWelcomeEmailSettingRequest;
import com.batal.dto.ParentWelcomeEmailSettingResponse;
import com.batal.entity.User;
import com.batal.repository.UserRepository;
import com.batal.service.SystemSettingService;
import com.batal.service.ParentBulkEmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Academy-wide settings an admin can change at runtime.
 */
@RestController
@RequestMapping("/settings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SettingsController {

    private static final Logger log = LoggerFactory.getLogger(SettingsController.class);

    @Autowired
    private SystemSettingService systemSettingService;

    @Autowired
    private ParentBulkEmailService parentBulkEmailService;

    @Autowired
    private UserRepository userRepository;

    // GET /api/settings/parent-welcome-emails
    // Readable by managers too, so the parents list can explain why a newly
    // created parent was not emailed.
    @GetMapping("/parent-welcome-emails")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ParentWelcomeEmailSettingResponse> getParentWelcomeEmailSetting() {
        return ResponseEntity.ok(new ParentWelcomeEmailSettingResponse(
                systemSettingService.isParentWelcomeEmailEnabled(),
                parentBulkEmailService.countAwaitingWelcomeEmail()));
    }

    // PUT /api/settings/parent-welcome-emails
    // Resuming does not send anything to the parents who were held back while
    // it was paused - it only affects accounts created from now on. Those
    // waiting are invited deliberately, from the parents list.
    @PutMapping("/parent-welcome-emails")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParentWelcomeEmailSettingResponse> updateParentWelcomeEmailSetting(
            @Valid @RequestBody ParentWelcomeEmailSettingRequest request) {

        Long adminId = currentUserId();
        systemSettingService.setParentWelcomeEmailEnabled(request.getEnabled(), adminId);
        log.info("Parent welcome emails {} by user {}",
                request.getEnabled() ? "resumed" : "paused", adminId);

        return ResponseEntity.ok(new ParentWelcomeEmailSettingResponse(
                request.getEnabled(),
                parentBulkEmailService.countAwaitingWelcomeEmail()));
    }

    /** Null rather than throwing: not knowing who flipped it is not a reason to refuse. */
    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }
}
