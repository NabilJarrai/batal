package com.batal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for token validation response
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidateTokenResponse {

    private boolean valid;
    private String message;
    private String userEmail;
    private String userName;

    /**
     * Create an invalid token response
     */
    public static ValidateTokenResponse invalid(String message) {
        return new ValidateTokenResponse(false, message, null, null);
    }

    /**
     * Create a valid token response
     */
    public static ValidateTokenResponse valid(String userEmail, String userName) {
        return new ValidateTokenResponse(true, "Token is valid", userEmail, userName);
    }
}
