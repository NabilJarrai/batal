-- V12: Create schedule and communication tables
CREATE TABLE schedules (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    pitch_id BIGINT NOT NULL,
    zone VARCHAR(50),
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_schedule_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_pitch FOREIGN KEY (pitch_id) REFERENCES pitches(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time),
    CONSTRAINT chk_schedule_dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

-- Create communications table
CREATE TABLE communications (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('COMMENT', 'COMPLAINT', 'INQUIRY', 'FEEDBACK')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    priority VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_communication_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_communication_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create communication_replies table
CREATE TABLE communication_replies (
    id BIGSERIAL PRIMARY KEY,
    communication_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_reply_communication FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for schedule tables
CREATE INDEX idx_schedule_group ON schedules(group_id);
CREATE INDEX idx_schedule_pitch ON schedules(pitch_id);
CREATE INDEX idx_schedule_day ON schedules(day_of_week);
CREATE INDEX idx_schedule_time ON schedules(start_time, end_time);
CREATE INDEX idx_schedule_dates ON schedules(valid_from, valid_to);

-- Create indexes for communication tables
CREATE INDEX idx_communication_sender ON communications(sender_id);
CREATE INDEX idx_communication_receiver ON communications(receiver_id);
CREATE INDEX idx_communication_type ON communications(type);
CREATE INDEX idx_communication_status ON communications(status);
CREATE INDEX idx_communication_created ON communications(created_at);
CREATE INDEX idx_reply_communication ON communication_replies(communication_id);
CREATE INDEX idx_reply_author ON communication_replies(author_id);
CREATE INDEX idx_reply_created ON communication_replies(created_at);
