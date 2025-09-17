-- V29: Consolidate player data into users table for normalization
-- This migration ensures all players have corresponding user records and consolidates data

-- Step 1: Create temporary backup of current players data
CREATE TABLE players_backup AS SELECT * FROM players;

-- Step 2: Ensure all players have corresponding user records
-- Only insert users for players that don't have existing user records with the same email
INSERT INTO users (
    email, first_name, last_name, phone, date_of_birth, gender, address, 
    parent_name, joining_date, user_type, level, basic_foot, group_id, 
    is_active, inactive_reason, emergency_contact_name, emergency_contact_phone,
    password, created_at, updated_at
)
SELECT 
    p.email, 
    p.first_name, 
    p.last_name, 
    p.phone, 
    p.date_of_birth, 
    p.gender, 
    p.address,
    p.parent_name, 
    p.joining_date, 
    'PLAYER' as user_type, 
    p.level, 
    p.basic_foot, 
    p.group_id,
    p.is_active, 
    p.inactive_reason, 
    p.emergency_contact_name, 
    p.emergency_contact_phone,
    '$2a$10$K8.6T8Qm7Fz7zX2t3V8Hxu0N4B1L9M.P6R5S9T3A7C2E8F1G4H6I' as password, -- Default encoded password: 'player123'
    p.created_at, 
    p.updated_at
FROM players p 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = p.email);

-- Step 3: Update players.user_id for any missing links
-- Link players to their corresponding user records
UPDATE players p 
SET user_id = (
    SELECT u.id 
    FROM users u 
    WHERE u.email = p.email 
    AND u.user_type = 'PLAYER'
    LIMIT 1
) 
WHERE p.user_id IS NULL;

-- Step 4: Handle any duplicate emails by adding player ID suffix
UPDATE users 
SET email = CONCAT(SUBSTRING(email, 1, POSITION('@' IN email) - 1), '+player', id, SUBSTRING(email, POSITION('@' IN email)))
WHERE id IN (
    SELECT u2.id FROM (
        SELECT u.id, u.email,
        ROW_NUMBER() OVER (PARTITION BY u.email ORDER BY u.id) as rn
        FROM users u
        WHERE u.user_type = 'PLAYER'
    ) u2
    WHERE u2.rn > 1
);

-- Step 5: Ensure all players have user accounts and update missing user data from players
UPDATE users u
SET 
    phone = COALESCE(u.phone, (SELECT p.phone FROM players p WHERE p.user_id = u.id)),
    date_of_birth = COALESCE(u.date_of_birth, (SELECT p.date_of_birth FROM players p WHERE p.user_id = u.id)),
    gender = COALESCE(u.gender, (SELECT p.gender FROM players p WHERE p.user_id = u.id)),
    address = COALESCE(u.address, (SELECT p.address FROM players p WHERE p.user_id = u.id)),
    parent_name = COALESCE(u.parent_name, (SELECT p.parent_name FROM players p WHERE p.user_id = u.id)),
    joining_date = COALESCE(u.joining_date, (SELECT p.joining_date FROM players p WHERE p.user_id = u.id)),
    level = COALESCE(u.level, (SELECT p.level FROM players p WHERE p.user_id = u.id)),
    basic_foot = COALESCE(u.basic_foot, (SELECT p.basic_foot FROM players p WHERE p.user_id = u.id)),
    group_id = COALESCE(u.group_id, (SELECT p.group_id FROM players p WHERE p.user_id = u.id)),
    is_active = COALESCE(u.is_active, (SELECT p.is_active FROM players p WHERE p.user_id = u.id)),
    inactive_reason = COALESCE(u.inactive_reason, (SELECT p.inactive_reason FROM players p WHERE p.user_id = u.id)),
    emergency_contact_name = COALESCE(u.emergency_contact_name, (SELECT p.emergency_contact_name FROM players p WHERE p.user_id = u.id)),
    emergency_contact_phone = COALESCE(u.emergency_contact_phone, (SELECT p.emergency_contact_phone FROM players p WHERE p.user_id = u.id)),
    updated_at = CURRENT_TIMESTAMP
WHERE u.user_type = 'PLAYER';

-- Step 6: Assign PLAYER role to all player users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.user_type = 'PLAYER' 
  AND r.name = 'PLAYER'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Step 7: Create validation report
-- Log any issues found during migration
DO $$ 
DECLARE
    orphaned_players INTEGER;
    missing_user_links INTEGER;
    duplicate_emails INTEGER;
BEGIN
    -- Check for orphaned players (players without user accounts)
    SELECT COUNT(*) INTO orphaned_players
    FROM players p
    WHERE p.user_id IS NULL OR p.user_id NOT IN (SELECT id FROM users);
    
    -- Check for missing user links
    SELECT COUNT(*) INTO missing_user_links
    FROM users u
    WHERE u.user_type = 'PLAYER' 
    AND NOT EXISTS (SELECT 1 FROM players p WHERE p.user_id = u.id);
    
    -- Check for duplicate emails
    SELECT COUNT(*) INTO duplicate_emails
    FROM (
        SELECT email, COUNT(*) as cnt
        FROM users
        WHERE user_type = 'PLAYER'
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Log results
    RAISE NOTICE 'Migration V29 completed:';
    RAISE NOTICE '- Orphaned players found: %', orphaned_players;
    RAISE NOTICE '- Missing user links: %', missing_user_links;
    RAISE NOTICE '- Duplicate emails remaining: %', duplicate_emails;
    
    IF orphaned_players > 0 OR missing_user_links > 0 OR duplicate_emails > 0 THEN
        RAISE NOTICE 'WARNING: Data inconsistencies detected. Manual review recommended.';
    ELSE
        RAISE NOTICE 'SUCCESS: All player data successfully consolidated to users table.';
    END IF;
END $$;

-- Step 8: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_player_type ON users(user_type) WHERE user_type = 'PLAYER';
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level) WHERE level IS NOT NULL;

-- Add comment for future reference
COMMENT ON TABLE players_backup IS 'Backup of players table before V29 normalization migration. Can be dropped after verification.';