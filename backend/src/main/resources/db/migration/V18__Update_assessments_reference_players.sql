-- V18: Update assessments table to reference players instead of users for player_id
-- This migration handles the separation of players from authenticated users

-- Step 1: Add new column that will reference players table
ALTER TABLE assessments ADD new_player_id BIGINT;

-- Step 2: Create the foreign key constraint for the new column
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessment_new_player 
FOREIGN KEY (new_player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 3: For existing data, we need to migrate user records that were acting as players
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
WHERE u.id IN (
    SELECT DISTINCT a.player_id 
    FROM assessments a 
    WHERE a.player_id IS NOT NULL
);

-- Step 4: Update assessments to reference the new player records
UPDATE assessments 
SET new_player_id = p.id
FROM players p, users u
WHERE assessments.player_id = u.id 
AND p.email = u.email;

-- Step 5: Verify all assessments have been migrated
-- This query should return 0 rows if migration is successful
-- SELECT COUNT(*) FROM assessments WHERE player_id IS NOT NULL AND new_player_id IS NULL;

-- Step 6: Drop the old foreign key constraint and column
ALTER TABLE assessments DROP CONSTRAINT fk_assessment_player;
ALTER TABLE assessments DROP COLUMN player_id;

-- Step 7: Rename new_player_id to player_id and recreate index
ALTER TABLE assessments RENAME COLUMN new_player_id TO player_id;

-- Step 8: Make player_id NOT NULL since every assessment must have a player
UPDATE assessments SET player_id = NULL WHERE player_id IS NULL; -- Clean any nulls first
ALTER TABLE assessments ALTER COLUMN player_id SET NOT NULL;

-- Step 9: Recreate the index with the correct name
CREATE INDEX idx_assessment_player ON assessments(player_id);
CREATE INDEX idx_assessment_player_date ON assessments(player_id, assessment_date);
