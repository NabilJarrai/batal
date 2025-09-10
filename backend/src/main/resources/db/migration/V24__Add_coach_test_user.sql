-- Add test coach user for development
-- Password is 'coach123' hashed with bcrypt

-- Insert coach user only if it doesn't exist
INSERT INTO users (
    id,
    first_name,
    last_name,
    email,
    password,
    phone,
    user_type,
    is_active,
    joining_date,
    created_at,
    updated_at
)
SELECT 100, 'Coach', 'Test', 'coach@batal.com', '$2a$10$5JTJMJz.qXr1vT1yJYvFOe5xPWCX5wKgYv8u4mMFJGm.fYqrhVWNu', '+971501234567', 'COACH', true, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'coach@batal.com');

-- Insert COACH role if it doesn't exist
INSERT INTO roles (id, name, description, created_at)
SELECT 3, 'COACH', 'Coach role with limited permissions', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'COACH');

-- Assign COACH role to the test coach user
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 100, 3, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM users WHERE id = 100)
AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 100 AND role_id = 3);

-- Assign coach to a group (Tigers group for example)
UPDATE groups 
SET coach_id = 100 
WHERE name = 'Tigers' AND coach_id IS NULL;