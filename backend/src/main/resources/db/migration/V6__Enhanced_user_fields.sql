-- V6: Enhanced user fields for different user types and player-specific data
-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN parent_name VARCHAR(255),
ADD COLUMN joining_date DATE,
ADD COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
ADD COLUMN title VARCHAR(100),
ADD COLUMN level VARCHAR(20),
ADD COLUMN basic_foot VARCHAR(10),
ADD COLUMN inactive_reason TEXT,
ADD COLUMN group_id BIGINT;

-- Update existing users to have proper user_type and joining_date
-- Set admin users to ADMIN type based on their roles
UPDATE users 
SET user_type = 'ADMIN', 
    joining_date = COALESCE(created_at::date, CURRENT_DATE),
    title = 'System Administrator'
WHERE id IN (
    SELECT DISTINCT u.id 
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'ADMIN'
);

-- Set all other users to have a joining_date if they don't have one
UPDATE users 
SET joining_date = COALESCE(created_at::date, CURRENT_DATE)
WHERE joining_date IS NULL;

-- Add constraints for enum fields
ALTER TABLE users 
ADD CONSTRAINT chk_user_type CHECK (user_type IN ('PLAYER', 'COACH', 'ADMIN', 'MANAGER')),
ADD CONSTRAINT chk_level CHECK (level IN ('DEVELOPMENT', 'ADVANCED')),
ADD CONSTRAINT chk_basic_foot CHECK (basic_foot IN ('LEFT', 'RIGHT'));

-- Add indexes for better query performance
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_joining_date ON users(joining_date);
CREATE INDEX idx_users_group_id ON users(group_id);

-- Add constraint that parent_name is required for players
ALTER TABLE users 
ADD CONSTRAINT chk_player_parent_name 
CHECK (user_type != 'PLAYER' OR parent_name IS NOT NULL);

-- Add constraint that joining_date is required for all users
ALTER TABLE users 
ADD CONSTRAINT chk_joining_date_required 
CHECK (joining_date IS NOT NULL);

-- Add constraint that level is required for players
ALTER TABLE users 
ADD CONSTRAINT chk_player_level 
CHECK (user_type != 'PLAYER' OR level IS NOT NULL);

-- Add constraint that basic_foot is required for players
ALTER TABLE users 
ADD CONSTRAINT chk_player_basic_foot 
CHECK (user_type != 'PLAYER' OR basic_foot IS NOT NULL);

-- Add constraint that inactive_reason is required when user is inactive
ALTER TABLE users 
ADD CONSTRAINT chk_inactive_reason 
CHECK (is_active = true OR inactive_reason IS NOT NULL);
UPDATE users SET 
    user_type = CASE 
        WHEN id = 1 THEN 'ADMIN'  -- Assuming first user is admin
        ELSE 'PLAYER' 
    END,
    joining_date = COALESCE(created_at::date, CURRENT_DATE)
WHERE user_type IS NULL OR joining_date IS NULL;
