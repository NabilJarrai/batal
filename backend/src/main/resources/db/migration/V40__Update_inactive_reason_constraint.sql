-- =====================================================
-- Migration: Update inactive_reason constraint
-- Description: Allow null inactive_reason for users pending password setup
-- Author: System
-- Date: 2025-10-13
-- =====================================================

-- Drop the old constraint that required inactive_reason for all inactive users
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_inactive_reason;

-- Add new constraint that allows null inactive_reason when password is not set yet
-- This accommodates the new email-based password setup flow
ALTER TABLE users
ADD CONSTRAINT chk_inactive_reason
CHECK (
    is_active = true                          -- Active users don't need inactive_reason
    OR inactive_reason IS NOT NULL             -- Inactive users with reason
    OR password_set_at IS NULL                 -- Inactive users pending password setup
);

COMMENT ON CONSTRAINT chk_inactive_reason ON users IS
'Inactive users must have a reason unless they are pending password setup (password_set_at IS NULL)';
