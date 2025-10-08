-- Migration V35: Fix parent user passwords and player gender values
-- This migration corrects the BCrypt password hashes and gender enum values for test data

-- PART 1: Update parent user passwords with correct BCrypt hash for 'parent123'
UPDATE users
SET password = '$2a$10$/NBqXsvgsxMjMpkWds03cO.g755fvQpzqcHYc0jXchXzYpgujXOSm'
WHERE email IN ('parent1@batal.com', 'parent2@batal.com')
  AND user_type = 'PARENT';

-- PART 2: Fix gender values to match enum constraints (MALE/FEMALE instead of Male/Female)
UPDATE players
SET gender = 'MALE'
WHERE gender = 'Male'
  AND parent_id IS NOT NULL;

UPDATE players
SET gender = 'FEMALE'
WHERE gender = 'Female'
  AND parent_id IS NOT NULL;

-- Verification
DO $$
DECLARE
    updated_parents INTEGER;
    updated_players INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_parents
    FROM users
    WHERE email IN ('parent1@batal.com', 'parent2@batal.com')
      AND password = '$2a$10$/NBqXsvgsxMjMpkWds03cO.g755fvQpzqcHYc0jXchXzYpgujXOSm';

    SELECT COUNT(*) INTO updated_players
    FROM players
    WHERE parent_id IS NOT NULL
      AND gender IN ('MALE', 'FEMALE');

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration V35 Completed';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Parent passwords updated: %', updated_parents;
    RAISE NOTICE 'Player genders corrected: %', updated_players;
    RAISE NOTICE '========================================';
END $$;
