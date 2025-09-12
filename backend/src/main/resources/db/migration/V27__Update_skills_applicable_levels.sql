-- Migration to update skills table for multiple applicable levels
-- Drop the existing applicable_level column and create new join table

-- First create the new join table for skill applicable levels
CREATE TABLE skill_applicable_levels (
    skill_id BIGINT NOT NULL,
    level VARCHAR(255) NOT NULL,
    CONSTRAINT fk_skill_applicable_levels_skill 
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT pk_skill_applicable_levels 
        PRIMARY KEY (skill_id, level)
);

-- Migrate existing data from applicable_level column to new join table
INSERT INTO skill_applicable_levels (skill_id, level)
SELECT id, applicable_level FROM skills WHERE applicable_level IS NOT NULL;

-- Drop the old applicable_level column
ALTER TABLE skills DROP COLUMN applicable_level;

-- Update the unique constraint to only use name (remove category)
ALTER TABLE skills DROP CONSTRAINT IF EXISTS UK_skills_name_category;
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_name_category_key;

-- Handle duplicate names by removing duplicates, keeping the first one (lowest ID)
DELETE FROM skills s1 
WHERE EXISTS (
    SELECT 1 FROM skills s2 
    WHERE s2.name = s1.name 
    AND s2.id < s1.id
);

-- Now add the unique constraint on name
ALTER TABLE skills ADD CONSTRAINT UK_skills_name UNIQUE (name);