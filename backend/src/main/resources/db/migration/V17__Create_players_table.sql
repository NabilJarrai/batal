-- V17: Create players table for managing player information separately from authenticated users
CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    parent_name VARCHAR(200),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    level VARCHAR(20) NOT NULL DEFAULT 'DEVELOPMENT' CHECK (level IN ('DEVELOPMENT', 'ADVANCED')),
    basic_foot VARCHAR(10) CHECK (basic_foot IN ('RIGHT', 'LEFT', 'BOTH')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for players
CREATE INDEX idx_players_first_name ON players(first_name);
CREATE INDEX idx_players_last_name ON players(last_name);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_level ON players(level);
CREATE INDEX idx_players_joining_date ON players(joining_date);
CREATE INDEX idx_players_is_active ON players(is_active);
CREATE INDEX idx_players_full_name ON players(first_name, last_name);

-- Add comments to table and columns
COMMENT ON TABLE players IS 'Players table for managing non-authenticated player information';
COMMENT ON COLUMN players.parent_name IS 'Parent or guardian name for young players';
COMMENT ON COLUMN players.level IS 'Player development level: DEVELOPMENT or ADVANCED';
COMMENT ON COLUMN players.basic_foot IS 'Player dominant foot preference';
