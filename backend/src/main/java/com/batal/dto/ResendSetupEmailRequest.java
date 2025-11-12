package com.batal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for resending password setup email request.
 * Unauthenticated users provide their email to receive a new password setup link.
 * Used by users whose original setup link has expired.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResendSetupEmailRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;
}
