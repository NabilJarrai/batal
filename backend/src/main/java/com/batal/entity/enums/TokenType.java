package com.batal.entity.enums;

/**
 * Enum representing the type of password token.
 * Used to distinguish between initial password setup (for new users)
 * and password reset (for existing users).
 */
public enum TokenType {
    /**
     * Token for initial password setup (new users who haven't set a password yet)
     */
    SETUP,

    /**
     * Token for password reset (existing users who forgot their password)
     */
    RESET
}
