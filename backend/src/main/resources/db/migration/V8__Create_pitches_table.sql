-- V8: Create pitches table
CREATE TABLE pitches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    zones INTEGER NOT NULL DEFAULT 1 CHECK (zones >= 1),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_pitches_is_active ON pitches(is_active);
CREATE INDEX idx_pitches_name ON pitches(name);

-- Insert default pitches
INSERT INTO pitches (name, description, zones, location) VALUES
('Main Pitch', 'Primary training pitch with multiple zones', 4, 'Central area'),
('Practice Pitch', 'Secondary pitch for specialized training', 2, 'North side'),
('Youth Pitch', 'Smaller pitch designed for younger players', 3, 'South side');
