-- V20: Fix migration for updating assessments to reference players
-- This migration corrects the V18 migration that failed

-- Step 1: Drop the foreign key constraint from assessments table
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS fk_assessments_player_id;

-- Step 2: For existing data, we need to migrate user records that were acting as players
-- First, let's create a temporary mapping by inserting user data into players table
-- Note: This assumes existing 'player' users should become actual players
INSERT INTO players (first_name, last_name, email, phone_number, date_of_birth, parent_name, joining_date, level, basic_foot, is_active, created_at, updated_at)
SELECT 
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.date_of_birth,
    u.parent_name,
    COALESCE(u.joining_date, u.created_at::date, CURRENT_DATE) as joining_date,
    COALESCE(u.level, 'DEVELOPMENT') as level,
    u.basic_foot,
    u.is_active,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.user_type = 'PLAYER' 
AND u.id IN (
    SELECT DISTINCT a.player_id 
    FROM assessments a 
    WHERE a.player_id IS NOT NULL
);

-- Step 3: Create a mapping table to track the migration from user IDs to player IDs
CREATE TEMP TABLE user_to_player_mapping AS
SELECT 
    u.id as user_id,
    p.id as player_id
FROM users u
JOIN players p ON (
    u.first_name = p.first_name 
    AND u.last_name = p.last_name 
    AND u.email = p.email
)
WHERE u.user_type = 'PLAYER';

-- Step 4: Update assessments to reference the new player records
UPDATE assessments 
SET player_id = m.player_id
FROM user_to_player_mapping m
WHERE assessments.player_id = m.user_id;

-- Step 5: Add the foreign key constraint to players table
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_player_id 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 6: Update memberships to reference players instead of users
-- Note: This assumes memberships with user_type='PLAYER' should reference players
UPDATE memberships 
SET player_id = m.player_id
FROM user_to_player_mapping m
WHERE memberships.player_id = m.user_id;

-- Step 7: Add foreign key constraint for memberships
ALTER TABLE memberships 
ADD CONSTRAINT fk_memberships_player_id 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 8: Remove player records from users table (they are now in players table)
DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM users WHERE user_type = 'PLAYER'
);

DELETE FROM users WHERE user_type = 'PLAYER';
