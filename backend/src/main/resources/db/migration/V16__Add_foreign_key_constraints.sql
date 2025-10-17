-- V16: Add foreign key constraints after all tables are created
-- Add foreign key constraint from groups to pitches table
ALTER TABLE groups 
ADD CONSTRAINT fk_group_pitch FOREIGN KEY (pitch_id) REFERENCES pitches(id) ON DELETE SET NULL;
