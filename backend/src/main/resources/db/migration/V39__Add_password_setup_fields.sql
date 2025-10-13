-- =====================================================
-- Migration: Add password setup tracking fields
-- Description: Track when users set their passwords and make password nullable
-- Author: System
-- Date: 2025-10-13
-- =====================================================

-- Add field to track when user first set their password
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMP;

-- Mark existing users as having set passwords (backfill)
UPDATE users
SET password_set_at = created_at
WHERE password IS NOT NULL
  AND password_set_at IS NULL;

-- Make password nullable for new users who haven't set their password yet
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.password_set_at IS 'Timestamp when user first set their password via email setup link';

-- Verification query (optional - for logging)
DO $$
DECLARE
    users_with_password INTEGER;
    users_without_password INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_with_password FROM users WHERE password IS NOT NULL;
    SELECT COUNT(*) INTO users_without_password FROM users WHERE password IS NULL;

    RAISE NOTICE '=== Password Setup Migration Summary ===';
    RAISE NOTICE 'Users with password set: %', users_with_password;
    RAISE NOTICE 'Users without password: %', users_without_password;
END $$;
