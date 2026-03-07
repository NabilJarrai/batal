-- Remove email and phone columns from players table
-- Contact info should come from the parent User entity

-- Drop the dependent view first
DROP VIEW IF EXISTS player_full_info;

-- Drop unique constraint on email first
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_email_key;
ALTER TABLE players ALTER COLUMN email DROP NOT NULL;

-- Drop the columns
ALTER TABLE players DROP COLUMN IF EXISTS email;
ALTER TABLE players DROP COLUMN IF EXISTS phone;

-- Recreate the view without email and phone
CREATE OR REPLACE VIEW player_full_info AS
SELECT p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    p.address,
    p.joining_date,
    p.level,
    p.basic_foot,
    p.group_id,
    p.is_active,
    p.inactive_reason,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.created_at,
    p.updated_at,
    p.player_number,
    p."position",
    p.assessment_notes,
    p.medical_notes,
    p.jersey_size,
    p.equipment_notes,
    p.development_goals,
    p.parent_id,
    g.name AS group_name,
    g.level AS group_level,
    g.age_group,
    u.first_name AS parent_first_name,
    u.last_name AS parent_last_name,
    u.email AS parent_email,
    u.phone AS parent_phone
FROM players p
    LEFT JOIN groups g ON g.id = p.group_id
    LEFT JOIN users u ON u.id = p.parent_id AND u.user_type::text = 'PARENT'::text;
