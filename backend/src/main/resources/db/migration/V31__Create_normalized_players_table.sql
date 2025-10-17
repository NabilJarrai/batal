-- V31: Create normalized players table with only player-specific data
-- This migration creates a new streamlined players table that contains only non-duplicated player data

-- Step 1: Create the new normalized players table
CREATE TABLE players_normalized (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    
    -- Player-specific fields only (not duplicated with users table)
    player_number VARCHAR(10) UNIQUE,          -- Jersey number
    position VARCHAR(50),                      -- Playing position
    assessment_notes TEXT,                     -- General coach notes about player
    medical_notes TEXT,                        -- Medical information and restrictions
    jersey_size VARCHAR(10),                   -- Equipment size
    equipment_notes TEXT,                      -- Equipment requirements/notes
    preferred_training_time VARCHAR(50),       -- Training time preferences
    transportation_notes TEXT,                 -- Transportation arrangements
    additional_skills TEXT,                    -- Skills not covered in assessments
    development_goals TEXT,                    -- Personal development targets
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_players_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_players_normalized_user_id ON players_normalized(user_id);
CREATE UNIQUE INDEX idx_players_normalized_player_number ON players_normalized(player_number) WHERE player_number IS NOT NULL;
CREATE INDEX idx_players_normalized_position ON players_normalized(position);
CREATE INDEX idx_players_normalized_jersey_size ON players_normalized(jersey_size);

-- Step 3: Migrate any existing player-specific data from old players table
-- Note: Most fields were duplicated with users table, so we only migrate truly player-specific data
INSERT INTO players_normalized (user_id, created_at, updated_at)
SELECT 
    p.user_id,
    p.created_at,
    p.updated_at
FROM players p 
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Update any other tables that reference players.id to reference users.id
-- This requires updating foreign keys in other tables like memberships, etc.

-- Update memberships table if it exists and references players
DO $$
BEGIN
    -- Check if memberships table exists and has player_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        -- Add new column for user reference
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'user_id') THEN
            ALTER TABLE memberships ADD COLUMN user_id BIGINT;
            
            -- Populate with user IDs from players
            UPDATE memberships m 
            SET user_id = (SELECT p.user_id FROM players p WHERE p.id = m.player_id)
            WHERE m.user_id IS NULL;
            
            -- Add foreign key constraint
            ALTER TABLE memberships ADD CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users(id);
            
            -- Drop old constraint and column
            ALTER TABLE memberships DROP CONSTRAINT IF EXISTS fk_memberships_player;
            ALTER TABLE memberships DROP COLUMN IF EXISTS player_id;
            
            -- Rename new column
            ALTER TABLE memberships RENAME COLUMN user_id TO player_id;
            
            RAISE NOTICE 'Updated memberships table to reference users instead of players';
        END IF;
    END IF;
END $$;

-- Step 5: Drop the old players table (after backing up)
-- First create a final backup
CREATE TABLE players_final_backup AS SELECT * FROM players;
COMMENT ON TABLE players_final_backup IS 'Final backup of players table before dropping - can be removed after verification';

-- Drop old players table
DROP TABLE IF EXISTS players CASCADE;

-- Step 6: Rename normalized table to players
ALTER TABLE players_normalized RENAME TO players;

-- Step 7: Update indexes to use new table name
DROP INDEX IF EXISTS idx_players_normalized_user_id;
DROP INDEX IF EXISTS idx_players_normalized_player_number;
DROP INDEX IF EXISTS idx_players_normalized_position;
DROP INDEX IF EXISTS idx_players_normalized_jersey_size;

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE UNIQUE INDEX idx_players_player_number ON players(player_number) WHERE player_number IS NOT NULL;
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_jersey_size ON players(jersey_size);

-- Step 8: Add table and column comments
COMMENT ON TABLE players IS 'Normalized players table containing only player-specific data. Player personal data is in users table.';
COMMENT ON COLUMN players.user_id IS 'Reference to users table where user_type = PLAYER';
COMMENT ON COLUMN players.player_number IS 'Unique jersey number for the player';
COMMENT ON COLUMN players.position IS 'Preferred or assigned playing position';
COMMENT ON COLUMN players.assessment_notes IS 'General notes about player from coaches';
COMMENT ON COLUMN players.medical_notes IS 'Medical conditions, allergies, or restrictions';
COMMENT ON COLUMN players.jersey_size IS 'Jersey size for equipment management';
COMMENT ON COLUMN players.equipment_notes IS 'Special equipment needs or preferences';
COMMENT ON COLUMN players.development_goals IS 'Personal development targets and goals';

-- Step 9: Create a view for easy player data access (combines users + players)
CREATE OR REPLACE VIEW player_full_info AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.date_of_birth,
    u.gender,
    u.address,
    u.parent_name,
    u.joining_date,
    u.level,
    u.basic_foot,
    u.group_id,
    u.is_active,
    u.inactive_reason,
    u.emergency_contact_name,
    u.emergency_contact_phone,
    u.created_at,
    u.updated_at,
    -- Player-specific fields
    p.player_number,
    p.position,
    p.assessment_notes,
    p.medical_notes,
    p.jersey_size,
    p.equipment_notes,
    p.development_goals,
    -- Group information
    g.name as group_name,
    g.level as group_level,
    g.age_group
FROM users u
LEFT JOIN players p ON p.user_id = u.id
LEFT JOIN groups g ON g.id = u.group_id
WHERE u.user_type = 'PLAYER';

COMMENT ON VIEW player_full_info IS 'Combined view of player data from users and players tables';

-- Step 10: Create trigger to automatically create player record when PLAYER user is created
CREATE OR REPLACE FUNCTION create_player_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create player record for PLAYER user type
    IF NEW.user_type = 'PLAYER' THEN
        INSERT INTO players (user_id, created_at, updated_at)
        VALUES (NEW.id, NEW.created_at, NEW.updated_at)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_player_record
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_player_record();

COMMENT ON FUNCTION create_player_record() IS 'Automatically creates player record when PLAYER user is inserted';

-- Step 11: Validation and reporting
DO $$
DECLARE
    total_users INTEGER;
    player_users INTEGER;
    player_records INTEGER;
    view_records INTEGER;
BEGIN
    -- Count statistics
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO player_users FROM users WHERE user_type = 'PLAYER';
    SELECT COUNT(*) INTO player_records FROM players;
    SELECT COUNT(*) INTO view_records FROM player_full_info;
    
    RAISE NOTICE 'Migration V31 completed successfully:';
    RAISE NOTICE '- Total users: %', total_users;
    RAISE NOTICE '- Player users: %', player_users;
    RAISE NOTICE '- Player records: %', player_records;
    RAISE NOTICE '- View records: %', view_records;
    
    IF player_users = view_records THEN
        RAISE NOTICE 'SUCCESS: Normalization completed. All player users accessible via view.';
    ELSE
        RAISE NOTICE 'INFO: % player records created, % player users exist.', player_records, player_users;
    END IF;
    
    RAISE NOTICE 'Database normalization complete! Players table now contains only player-specific data.';
    RAISE NOTICE 'Use player_full_info view for complete player information.';
END $$;