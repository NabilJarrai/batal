-- V21: Add missing columns to players table to match Player entity

-- Add address column
ALTER TABLE players ADD address TEXT;

-- Add gender column
ALTER TABLE players ADD gender VARCHAR(10);
ALTER TABLE players ADD CONSTRAINT chk_players_gender CHECK (gender IN ('MALE', 'FEMALE'));

-- Add emergency contact fields  
ALTER TABLE players ADD emergency_contact_name VARCHAR(255);
ALTER TABLE players ADD emergency_contact_phone VARCHAR(20);

-- Add inactive reason column
ALTER TABLE players ADD inactive_reason TEXT;

-- Add group relationship column
ALTER TABLE players ADD group_id BIGINT;

-- Rename phone_number to phone to match entity
ALTER TABLE players RENAME COLUMN phone_number TO phone;

-- Add foreign key constraint for group relationship
ALTER TABLE players ADD CONSTRAINT fk_players_group 
    FOREIGN KEY (group_id) REFERENCES groups(id);

-- Add indexes for new columns
CREATE INDEX idx_players_gender ON players(gender);
CREATE INDEX idx_players_group_id ON players(group_id);
