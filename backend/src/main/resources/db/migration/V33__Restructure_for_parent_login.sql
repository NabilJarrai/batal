-- ============================================
-- V33: Restructure for Parent Login
-- Move all player data to players table, remove players from users table
-- Create clean separation: users = auth accounts, players = non-auth data
-- ============================================

-- PART 1: Add missing columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS level VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS basic_foot VARCHAR(10);
ALTER TABLE players ADD COLUMN IF NOT EXISTS group_id BIGINT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS inactive_reason TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- PART 2: Add parent relationship to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS parent_id BIGINT;

-- PART 3: Migrate data from users to players (only if user_id column still exists)
-- Update existing player records with data from their linked user records
DO $$
BEGIN
    -- Only run migration if user_id column exists (migration not already run)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'players' AND column_name = 'user_id'
    ) THEN
        UPDATE players p
        SET
            first_name = COALESCE(p.first_name, u.first_name),
            last_name = COALESCE(p.last_name, u.last_name),
            email = COALESCE(p.email, u.email),
            phone = COALESCE(p.phone, u.phone),
            date_of_birth = COALESCE(p.date_of_birth, u.date_of_birth),
            gender = COALESCE(p.gender, u.gender::varchar),
            address = COALESCE(p.address, u.address),
            joining_date = COALESCE(p.joining_date, u.joining_date),
            level = COALESCE(p.level, u.level::varchar),
            basic_foot = COALESCE(p.basic_foot, u.basic_foot::varchar),
            group_id = COALESCE(p.group_id, u.group_id),
            is_active = COALESCE(p.is_active, u.is_active),
            inactive_reason = COALESCE(p.inactive_reason, u.inactive_reason),
            emergency_contact_name = COALESCE(p.emergency_contact_name, u.emergency_contact_name),
            emergency_contact_phone = COALESCE(p.emergency_contact_phone, u.emergency_contact_phone)
        FROM users u
        WHERE p.user_id = u.id AND u.user_type = 'PLAYER';

        RAISE NOTICE 'Migrated player data from users table to players table';
    ELSE
        RAISE NOTICE 'Skipping player data migration - user_id column already removed (migration previously completed)';
    END IF;
END $$;

-- PART 4: Add foreign key for group relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_players_group'
    ) THEN
        ALTER TABLE players
        ADD CONSTRAINT fk_players_group
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- PART 5: Add foreign key for parent relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_players_parent'
    ) THEN
        ALTER TABLE players
        ADD CONSTRAINT fk_players_parent
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- PART 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_parent_id ON players(parent_id);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_group_id ON players(group_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_first_name ON players(first_name);
CREATE INDEX IF NOT EXISTS idx_players_last_name ON players(last_name);
CREATE INDEX IF NOT EXISTS idx_players_full_name ON players(first_name, last_name);

-- PART 7: Add unique constraint on email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'players_email_unique'
    ) THEN
        ALTER TABLE players ADD CONSTRAINT players_email_unique UNIQUE (email);
    END IF;
END $$;

-- PART 8: Make required fields NOT NULL (only if all values are populated)
DO $$
BEGIN
    -- Check if any null values exist before adding constraints
    IF NOT EXISTS (SELECT 1 FROM players WHERE first_name IS NULL) THEN
        ALTER TABLE players ALTER COLUMN first_name SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE last_name IS NULL) THEN
        ALTER TABLE players ALTER COLUMN last_name SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM players WHERE email IS NULL) THEN
        ALTER TABLE players ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

-- PART 9: Add PARENT role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'PARENT') THEN
        INSERT INTO roles (name) VALUES ('PARENT');
    END IF;
END $$;

-- PART 10: Remove player users from users table
-- First remove from user_roles junction table
DELETE FROM user_roles
WHERE user_id IN (SELECT id FROM users WHERE user_type = 'PLAYER');

-- Then remove from users table
DELETE FROM users WHERE user_type = 'PLAYER';

-- PART 11: Drop dependent views before removing user_id column
DROP VIEW IF EXISTS player_full_info CASCADE;

-- PART 11b: Remove user_id from players table (no longer needed)
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_user_id_key;
ALTER TABLE players DROP COLUMN IF EXISTS user_id;

-- PART 12: Remove player-specific fields from users table
ALTER TABLE users DROP COLUMN IF EXISTS parent_name;
ALTER TABLE users DROP COLUMN IF EXISTS joining_date;
ALTER TABLE users DROP COLUMN IF EXISTS level;
ALTER TABLE users DROP COLUMN IF EXISTS basic_foot;
ALTER TABLE users DROP COLUMN IF EXISTS group_id;

-- PART 13: Remove PLAYER role and update user_type constraint
DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = 'PLAYER');
DELETE FROM roles WHERE name = 'PLAYER';

-- Update check constraint to remove PLAYER and add PARENT
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_type;
ALTER TABLE users ADD CONSTRAINT chk_user_type
    CHECK (user_type IN ('COACH', 'ADMIN', 'MANAGER', 'PARENT'));

-- PART 14: Add comments for documentation
COMMENT ON TABLE users IS 'Authenticating accounts only: PARENT, COACH, ADMIN, MANAGER';
COMMENT ON TABLE players IS 'All player data - players do not authenticate';
COMMENT ON COLUMN players.parent_id IS 'Reference to parent user account (users.id with user_type=PARENT)';
COMMENT ON COLUMN players.email IS 'Email for communication only, NOT for authentication';

-- PART 15: Validation and reporting
DO $$
DECLARE
    player_count INTEGER;
    users_with_player_type INTEGER;
    orphaned_assessments INTEGER;
    orphaned_memberships INTEGER;
    players_without_email INTEGER;
BEGIN
    SELECT COUNT(*) INTO player_count FROM players;
    SELECT COUNT(*) INTO users_with_player_type FROM users WHERE user_type = 'PLAYER';

    -- Check for orphaned assessments (shouldn't happen)
    SELECT COUNT(*) INTO orphaned_assessments
    FROM assessments a
    LEFT JOIN players p ON a.player_id = p.id
    WHERE p.id IS NULL;

    -- Check for orphaned memberships
    SELECT COUNT(*) INTO orphaned_memberships
    FROM memberships m
    LEFT JOIN players p ON m.player_id = p.id
    WHERE p.id IS NULL;

    -- Check for players without email
    SELECT COUNT(*) INTO players_without_email
    FROM players WHERE email IS NULL OR email = '';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration V33 Completed';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total players in players table: %', player_count;
    RAISE NOTICE 'Remaining player-type users in users table: %', users_with_player_type;
    RAISE NOTICE 'Orphaned assessments: %', orphaned_assessments;
    RAISE NOTICE 'Orphaned memberships: %', orphaned_memberships;
    RAISE NOTICE 'Players without email: %', players_without_email;
    RAISE NOTICE '========================================';

    IF users_with_player_type > 0 THEN
        RAISE WARNING 'WARNING: Some player-type users still exist in users table!';
    END IF;

    IF orphaned_assessments > 0 THEN
        RAISE WARNING 'WARNING: Some assessments reference non-existent players!';
    END IF;

    IF orphaned_memberships > 0 THEN
        RAISE WARNING 'WARNING: Some memberships reference non-existent players!';
    END IF;

    IF players_without_email > 0 THEN
        RAISE WARNING 'WARNING: Some players do not have email addresses!';
    END IF;

    IF users_with_player_type = 0 AND orphaned_assessments = 0 AND orphaned_memberships = 0 AND players_without_email = 0 THEN
        RAISE NOTICE 'SUCCESS: Player data successfully migrated to players table.';
        RAISE NOTICE 'Users table now contains only authenticating accounts.';
        RAISE NOTICE 'Players table contains all player data.';
    END IF;
END $$;

-- PART 16: Recreate player_full_info view with new structure
CREATE OR REPLACE VIEW player_full_info AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.date_of_birth,
    p.gender,
    p.address,
    p.joining_date,
    p.level,
    p.basic_foot,
    p.group_id,
    p.is_active,
    p.inactive_reason,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.created_at,
    p.updated_at,
    p.player_number,
    p.position,
    p.assessment_notes,
    p.medical_notes,
    p.jersey_size,
    p.equipment_notes,
    p.development_goals,
    p.parent_id,
    g.name AS group_name,
    g.level AS group_level,
    g.age_group,
    u.first_name AS parent_first_name,
    u.last_name AS parent_last_name,
    u.email AS parent_email,
    u.phone AS parent_phone
FROM players p
LEFT JOIN groups g ON g.id = p.group_id
LEFT JOIN users u ON u.id = p.parent_id AND u.user_type = 'PARENT';

COMMENT ON VIEW player_full_info IS 'Comprehensive view of player data with group and parent information';
