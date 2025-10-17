-- =====================================================
-- Migration: Remove deprecated first_login_at column
-- Description: Clean up unused first login tracking after migrating to email-based password setup
-- Author: System
-- Date: 2025-10-13
-- =====================================================

-- IMPORTANT: Only run this migration after verifying the email-based password setup works correctly
-- and you no longer need historical first_login_at data

-- Optional: Archive the data first (uncomment if you want to preserve historical data)
-- CREATE TABLE IF NOT EXISTS users_first_login_archive AS
-- SELECT id, email, first_name, last_name, first_login_at, created_at
-- FROM users
-- WHERE first_login_at IS NOT NULL;

-- Drop the deprecated column
ALTER TABLE users DROP COLUMN IF EXISTS first_login_at;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '=== First Login Column Removal Complete ===';
    RAISE NOTICE 'The first_login_at column has been removed from the users table.';
    RAISE NOTICE 'Email-based password setup (password_set_at) is now the only authentication flow.';
END $$;
