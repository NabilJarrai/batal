-- Add token_type column to support both password setup and password reset tokens
-- This allows us to reuse the same table for both initial password setup (for new users)
-- and password reset (for existing users)

-- Add token_type enum column with default value 'SETUP' for existing records
ALTER TABLE password_tokens
ADD COLUMN token_type VARCHAR(10) NOT NULL DEFAULT 'SETUP';

-- Add check constraint to ensure only valid token types
ALTER TABLE password_tokens
ADD CONSTRAINT check_token_type CHECK (token_type IN ('SETUP', 'RESET'));

-- Add index on token_type for faster queries when filtering by type
CREATE INDEX idx_password_tokens_type ON password_tokens(token_type);

-- Add composite index for common query pattern: user + type + validity
CREATE INDEX idx_password_tokens_user_type_valid
ON password_tokens(user_id, token_type, used_at, expires_at);
