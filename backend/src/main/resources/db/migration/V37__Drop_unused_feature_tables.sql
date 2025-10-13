-- V37: Drop unused feature tables
-- This migration removes database tables for features that have no implementation:
-- - Membership & Payment system
-- - Communication system
-- - Schedule management
-- - Nutrition programs
-- - Pitches (referenced by groups but unused)

-- Drop tables in order (respecting foreign key constraints)

-- Drop Payment tables first (depends on memberships)
DROP TABLE IF EXISTS payments CASCADE;

-- Drop Membership tables
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS membership_types CASCADE;

-- Drop Communication tables
DROP TABLE IF EXISTS communication_replies CASCADE;
DROP TABLE IF EXISTS communications CASCADE;

-- Drop Schedule table (depends on groups and pitches)
DROP TABLE IF EXISTS schedules CASCADE;

-- Drop Nutrition programs
DROP TABLE IF EXISTS nutrition_programs CASCADE;

-- Drop Pitches table (still referenced by groups.pitch_id, but not actively used)
-- Note: This will set pitch_id to NULL in groups table if ON DELETE SET NULL is configured
-- If not, we need to remove the foreign key constraint first
ALTER TABLE groups DROP CONSTRAINT IF EXISTS fk_groups_pitch;
DROP TABLE IF EXISTS pitches CASCADE;
