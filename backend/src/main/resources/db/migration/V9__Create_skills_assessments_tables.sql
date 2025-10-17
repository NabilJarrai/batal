-- V9: Create skills and skill_scores tables
CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('ATHLETIC', 'TECHNICAL', 'MENTALITY', 'PERSONALITY')),
    applicable_level VARCHAR(20) NOT NULL CHECK (applicable_level IN ('DEVELOPMENT', 'ADVANCED')),
    description VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint on name, category, and applicable_level
    CONSTRAINT uk_skill_name_category_level UNIQUE (name, category, applicable_level)
);

-- Create indexes for skills
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_applicable_level ON skills(applicable_level);
CREATE INDEX idx_skills_is_active ON skills(is_active);
CREATE INDEX idx_skills_display_order ON skills(display_order);

-- Create assessments table
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    assessor_id BIGINT NOT NULL,
    assessment_date DATE NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('MONTHLY', 'QUARTERLY')),
    comments TEXT,
    coach_notes TEXT,
    is_finalized BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_assessment_player FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_assessor FOREIGN KEY (assessor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for assessments
CREATE INDEX idx_assessment_player ON assessments(player_id);
CREATE INDEX idx_assessment_date ON assessments(assessment_date);
CREATE INDEX idx_assessment_player_date ON assessments(player_id, assessment_date);
CREATE INDEX idx_assessment_assessor ON assessments(assessor_id);
CREATE INDEX idx_assessment_period ON assessments(period);
CREATE INDEX idx_assessment_finalized ON assessments(is_finalized);

-- Create skill_scores table
CREATE TABLE skill_scores (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    notes VARCHAR(500),
    previous_score INTEGER CHECK (previous_score >= 1 AND previous_score <= 10),
    improvement INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_skill_score_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    CONSTRAINT fk_skill_score_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    
    -- Unique constraint - one score per skill per assessment
    CONSTRAINT uk_assessment_skill UNIQUE (assessment_id, skill_id)
);

-- Create indexes for skill_scores
CREATE INDEX idx_skill_score_assessment ON skill_scores(assessment_id);
CREATE INDEX idx_skill_score_skill ON skill_scores(skill_id);
CREATE INDEX idx_skill_score_score ON skill_scores(score);
CREATE INDEX idx_skill_score_improvement ON skill_scores(improvement);
