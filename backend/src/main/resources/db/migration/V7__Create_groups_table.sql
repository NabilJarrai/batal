-- V7: Create groups table
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('DEVELOPMENT', 'ADVANCED')),
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('COOKIES', 'DOLPHINS', 'TIGERS', 'LIONS')),
    group_number INTEGER NOT NULL DEFAULT 1 CHECK (group_number >= 1),
    min_age INTEGER NOT NULL CHECK (min_age >= 4),
    max_age INTEGER NOT NULL CHECK (max_age >= 4),
    capacity INTEGER NOT NULL DEFAULT 15 CHECK (capacity >= 1),
    coach_id BIGINT,
    pitch_id BIGINT,
    zone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_age_range CHECK (max_age >= min_age),
    CONSTRAINT uk_group_unique UNIQUE (level, age_group, group_number),
    
    -- Foreign key to users table (coach_id)
    CONSTRAINT fk_group_coach FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add foreign key constraint to users table for group_id
ALTER TABLE users 
ADD CONSTRAINT fk_user_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_groups_level ON groups(level);
CREATE INDEX idx_groups_age_group ON groups(age_group);
CREATE INDEX idx_groups_coach_id ON groups(coach_id);
CREATE INDEX idx_groups_pitch_id ON groups(pitch_id);
CREATE INDEX idx_groups_is_active ON groups(is_active);

-- Insert default groups for each level and age combination
INSERT INTO groups (name, level, age_group, group_number, min_age, max_age, capacity) VALUES
-- Development groups
('Development Cookies', 'DEVELOPMENT', 'COOKIES', 1, 4, 6, 15),
('Development Dolphins', 'DEVELOPMENT', 'DOLPHINS', 1, 7, 10, 15),
('Development Tigers', 'DEVELOPMENT', 'TIGERS', 1, 11, 13, 15),
('Development Lions', 'DEVELOPMENT', 'LIONS', 1, 14, 16, 15),

-- Advanced groups  
('Advanced Cookies', 'ADVANCED', 'COOKIES', 1, 4, 6, 15),
('Advanced Dolphins', 'ADVANCED', 'DOLPHINS', 1, 7, 10, 15),
('Advanced Tigers', 'ADVANCED', 'TIGERS', 1, 11, 13, 15),
('Advanced Lions', 'ADVANCED', 'LIONS', 1, 14, 16, 15);
