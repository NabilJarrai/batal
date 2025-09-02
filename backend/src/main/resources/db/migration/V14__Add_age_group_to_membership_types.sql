-- V14: Add age_group column to membership_types table
ALTER TABLE membership_types 
ADD COLUMN age_group VARCHAR(20) NOT NULL DEFAULT 'LIONS' CHECK (age_group IN ('COOKIES', 'DOLPHINS', 'TIGERS', 'LIONS'));

-- Create index for age_group
CREATE INDEX idx_membership_types_age_group ON membership_types(age_group);

-- Update existing membership types with appropriate age groups
UPDATE membership_types SET age_group = 'COOKIES' WHERE name LIKE '%Cookie%' OR name LIKE '%Children%' OR name LIKE '%Kids%';
UPDATE membership_types SET age_group = 'DOLPHINS' WHERE name LIKE '%Dolphin%' OR name LIKE '%Junior%';
UPDATE membership_types SET age_group = 'TIGERS' WHERE name LIKE '%Tiger%' OR name LIKE '%Teen%';

-- Ensure the combinations of name and age_group are unique
ALTER TABLE membership_types ADD CONSTRAINT uk_membership_name_age_group UNIQUE (name, age_group);
