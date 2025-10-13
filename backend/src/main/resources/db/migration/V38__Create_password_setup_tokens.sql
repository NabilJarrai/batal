-- =====================================================
-- Migration: Create password setup tokens table
-- Description: Stores one-time tokens for email-based password setup
-- Author: System
-- Date: 2025-10-13
-- =====================================================

-- Create password_setup_tokens table
CREATE TABLE password_setup_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_password_setup_token ON password_setup_tokens(token);
CREATE INDEX idx_password_setup_user_id ON password_setup_tokens(user_id);
CREATE INDEX idx_password_setup_expires_at ON password_setup_tokens(expires_at);

-- Add comments for documentation
COMMENT ON TABLE password_setup_tokens IS 'Stores one-time tokens for password setup via email';
COMMENT ON COLUMN password_setup_tokens.user_id IS 'Reference to the user who will set their password';
COMMENT ON COLUMN password_setup_tokens.token IS 'Secure random token sent via email (URL-safe base64)';
COMMENT ON COLUMN password_setup_tokens.expires_at IS 'Token expiration timestamp (typically 24-48 hours from creation)';
COMMENT ON COLUMN password_setup_tokens.used_at IS 'Timestamp when token was used to set password (null if unused)';
COMMENT ON COLUMN password_setup_tokens.created_at IS 'Token creation timestamp';
