-- V23: Add player authentication by linking players to users table

-- Step 1: Add PLAYER role to roles table
INSERT INTO roles (id, name) VALUES (4, 'ROLE_PLAYER') 
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add user_id column to players table to link with users
ALTER TABLE players ADD COLUMN user_id BIGINT UNIQUE;

-- Step 3: Add foreign key constraint
ALTER TABLE players 
ADD CONSTRAINT fk_player_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Create index for better performance
CREATE INDEX idx_players_user_id ON players(user_id);

-- Step 5: For existing players, create corresponding user accounts
DO $$
DECLARE
    player_record RECORD;
    new_user_id BIGINT;
BEGIN
    FOR player_record IN SELECT * FROM players WHERE user_id IS NULL
    LOOP
        -- Insert into users table with player data
        INSERT INTO users (
            email, 
            password, 
            first_name, 
            last_name, 
            phone, 
            date_of_birth,
            gender,
            address,
            parent_name,
            joining_date,
            user_type,
            level,
            basic_foot,
            emergency_contact_name,
            emergency_contact_phone,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            player_record.email,
            -- Default password: 'Player@2024' - This should be changed on first login
            '$2a$10$7JqG.MEVxvETdBLpLfKQaOmgQ3Ij6Fh4I9FnJYl2V5Kg6Z0GxF5Hy',
            player_record.first_name,
            player_record.last_name,
            player_record.phone,
            player_record.date_of_birth,
            player_record.gender::VARCHAR,
            player_record.address,
            player_record.parent_name,
            player_record.joining_date,
            'PLAYER',
            player_record.level,
            -- Handle basic_foot: convert BOTH to RIGHT, set RIGHT as default for NULL
            CASE 
                WHEN player_record.basic_foot IS NULL THEN 'RIGHT'
                WHEN player_record.basic_foot = 'BOTH' THEN 'RIGHT' 
                ELSE player_record.basic_foot::VARCHAR
            END,
            player_record.emergency_contact_name,
            player_record.emergency_contact_phone,
            player_record.is_active,
            player_record.created_at,
            player_record.updated_at
        ) RETURNING id INTO new_user_id;
        
        -- Link the player to the newly created user
        UPDATE players SET user_id = new_user_id WHERE id = player_record.id;
        
        -- Assign PLAYER role to the new user
        INSERT INTO user_roles (user_id, role_id) 
        VALUES (new_user_id, 4);
    END LOOP;
END $$;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN players.user_id IS 'Links player to their user account for authentication';