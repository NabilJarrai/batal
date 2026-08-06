package com.batal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for an administrator setting a password directly on another user's account.
 * Unlike {@link ResetPasswordRequest} there is no token: authorisation comes from
 * the caller's ADMIN role rather than from something emailed to the account owner.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPasswordResetRequest {

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    /**
     * Check if password and confirmation match
     */
    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }
}
