-- V25: Remove ROLE_ prefix from all role names for consistency

-- Update any existing ROLE_PLAYER entries to PLAYER
UPDATE roles SET name = 'PLAYER', description = 'Player with access to view their own assessments and profile' WHERE name = 'ROLE_PLAYER';

-- Ensure all role names are consistent (remove ROLE_ prefix if it exists)
UPDATE roles SET name = REPLACE(name, 'ROLE_', '') WHERE name LIKE 'ROLE_%';

-- Add description for PLAYER role if it doesn't exist
UPDATE roles SET description = 'Player with access to view their own assessments and profile' WHERE name = 'PLAYER' AND (description IS NULL OR description = '');

-- Add comment for documentation
COMMENT ON TABLE roles IS 'Roles table with consistent naming (no ROLE_ prefix)';