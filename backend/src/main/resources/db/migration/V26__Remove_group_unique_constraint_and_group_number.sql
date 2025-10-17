-- V26: Remove group unique constraint and group_number column for flexible group naming
-- This allows multiple groups with the same level and age group (e.g., "Development Lions 1", "Development Lions 2")

-- Drop the unique constraint that prevents multiple groups with same level/age_group
ALTER TABLE groups DROP CONSTRAINT IF EXISTS uk_group_unique;

-- Drop the group_number column as it's no longer used (names are now manually specified)
ALTER TABLE groups DROP COLUMN IF EXISTS group_number;

-- Update existing group names to be more descriptive (optional, for better UX)
UPDATE groups SET name = 'Development Cookies Group' WHERE name = 'Development Cookies';
UPDATE groups SET name = 'Development Dolphins Group' WHERE name = 'Development Dolphins';
UPDATE groups SET name = 'Development Tigers Group' WHERE name = 'Development Tigers';
UPDATE groups SET name = 'Development Lions Group' WHERE name = 'Development Lions';
UPDATE groups SET name = 'Advanced Cookies Group' WHERE name = 'Advanced Cookies';
UPDATE groups SET name = 'Advanced Dolphins Group' WHERE name = 'Advanced Dolphins';
UPDATE groups SET name = 'Advanced Tigers Group' WHERE name = 'Advanced Tigers';
UPDATE groups SET name = 'Advanced Lions Group' WHERE name = 'Advanced Lions';