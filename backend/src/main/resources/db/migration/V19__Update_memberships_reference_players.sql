-- V19: Update memberships table to reference players instead of users for player_id
-- This migration completes the separation of players from authenticated users

-- Step 1: Add new column that will reference players table
ALTER TABLE memberships ADD new_player_id BIGINT;

-- Step 2: Create the foreign key constraint for the new column
ALTER TABLE memberships 
ADD CONSTRAINT fk_membership_new_player 
FOREIGN KEY (new_player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Step 3: Update memberships to reference the new player records
-- This assumes the data migration from V18 has already moved user->player mappings
UPDATE memberships 
SET new_player_id = p.id
FROM players p, users u
WHERE memberships.player_id = u.id 
AND p.email = u.email;

-- Step 4: Verify all memberships have been migrated
-- This query should return 0 rows if migration is successful
-- SELECT COUNT(*) FROM memberships WHERE player_id IS NOT NULL AND new_player_id IS NULL;

-- Step 5: Drop the old foreign key constraint and column
ALTER TABLE memberships DROP CONSTRAINT fk_membership_player;
ALTER TABLE memberships DROP COLUMN player_id;

-- Step 6: Rename new_player_id to player_id
ALTER TABLE memberships RENAME COLUMN new_player_id TO player_id;

-- Step 7: Make player_id NOT NULL since every membership must have a player
ALTER TABLE memberships ALTER COLUMN player_id SET NOT NULL;

-- Step 8: Recreate indexes for the new column
CREATE INDEX idx_membership_player ON memberships(player_id);
CREATE INDEX idx_membership_player_status ON memberships(player_id, status);
CREATE INDEX idx_membership_player_dates ON memberships(player_id, start_date, end_date);
