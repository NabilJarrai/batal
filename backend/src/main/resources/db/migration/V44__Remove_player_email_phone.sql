-- Remove email and phone columns from players table
-- Contact info should come from the parent User entity

-- Drop unique constraint on email first
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_email_key;
ALTER TABLE players ALTER COLUMN email DROP NOT NULL;

-- Drop the columns
ALTER TABLE players DROP COLUMN IF EXISTS email;
ALTER TABLE players DROP COLUMN IF EXISTS phone;
