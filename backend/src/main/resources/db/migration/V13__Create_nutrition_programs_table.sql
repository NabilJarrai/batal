-- V13: Create nutrition programs table
CREATE TABLE nutrition_programs (
    id BIGSERIAL PRIMARY KEY,
    age_group VARCHAR(20) NOT NULL UNIQUE CHECK (age_group IN ('COOKIES', 'DOLPHINS', 'TIGERS', 'LIONS')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_nutrition_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for nutrition programs
CREATE INDEX idx_nutrition_age_group ON nutrition_programs(age_group);
CREATE INDEX idx_nutrition_uploaded_by ON nutrition_programs(uploaded_by_id);
CREATE INDEX idx_nutrition_is_active ON nutrition_programs(is_active);

-- Insert default nutrition programs (placeholders - files will be uploaded later)
INSERT INTO nutrition_programs (age_group, title, description, file_url, file_name, uploaded_by_id) VALUES
('COOKIES', 'Cookies Nutrition Program (Ages 4-6)', 'Basic healthy eating guidelines for young children', '/nutrition/cookies-program.pdf', 'cookies-program.pdf', 1),
('DOLPHINS', 'Dolphins Nutrition Program (Ages 7-10)', 'Growth-focused nutrition plan for developing children', '/nutrition/dolphins-program.pdf', 'dolphins-program.pdf', 1),
('TIGERS', 'Tigers Nutrition Program (Ages 11-13)', 'Athletic performance nutrition for pre-teens', '/nutrition/tigers-program.pdf', 'tigers-program.pdf', 1),
('LIONS', 'Lions Nutrition Program (Ages 14-16)', 'Advanced sports nutrition for teenagers', '/nutrition/lions-program.pdf', 'lions-program.pdf', 1);
