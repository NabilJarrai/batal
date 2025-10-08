-- Migration V34: Add parent test users for testing parent login functionality
-- Creates two parent accounts with children assigned to them

-- PART 1: Create first test parent (parent1@batal.com / parent123)
-- Password: parent123 (bcrypt encoded)
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    phone,
    date_of_birth,
    gender,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    user_type,
    is_active,
    created_at,
    updated_at
) VALUES (
    'parent1@batal.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7Mx/KPM2J5M3r3L3XgJxGPJx8YJ5EJu', -- bcrypt for 'parent123'
    'Ahmed',
    'Hassan',
    '+212612345678',
    '1985-03-15',
    'MALE',
    '123 Street, Casablanca, Morocco',
    'Fatima Hassan',
    '+212612345679',
    'PARENT',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- PART 2: Create second test parent (parent2@batal.com / parent123)
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    phone,
    date_of_birth,
    gender,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    user_type,
    is_active,
    created_at,
    updated_at
) VALUES (
    'parent2@batal.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye7Mx/KPM2J5M3r3L3XgJxGPJx8YJ5EJu', -- bcrypt for 'parent123'
    'Karim',
    'Benali',
    '+212623456789',
    '1988-07-22',
    'MALE',
    '456 Avenue, Rabat, Morocco',
    'Laila Benali',
    '+212623456790',
    'PARENT',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- PART 3: Assign PARENT role to test users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email IN ('parent1@batal.com', 'parent2@batal.com')
  AND r.name = 'PARENT'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- PART 4: Create test children for parent1 (Ahmed Hassan)
-- Child 1: Youssef Hassan (10 years old)
INSERT INTO players (
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    joining_date,
    level,
    basic_foot,
    emergency_contact_name,
    emergency_contact_phone,
    parent_id,
    player_number,
    position,
    is_active,
    created_at,
    updated_at
)
SELECT
    'Youssef',
    'Hassan',
    'youssef.hassan@family.com',
    '+212634567890',
    CURRENT_DATE - INTERVAL '10 years',
    'Male',
    '123 Street, Casablanca, Morocco',
    CURRENT_DATE - INTERVAL '2 years',
    'ADVANCED',
    'RIGHT',
    'Fatima Hassan',
    '+212612345679',
    u.id,
    7,
    'FORWARD',
    TRUE,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'parent1@batal.com'
ON CONFLICT DO NOTHING;

-- Child 2: Sara Hassan (8 years old)
INSERT INTO players (
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    joining_date,
    level,
    basic_foot,
    emergency_contact_name,
    emergency_contact_phone,
    parent_id,
    player_number,
    position,
    is_active,
    created_at,
    updated_at
)
SELECT
    'Sara',
    'Hassan',
    'sara.hassan@family.com',
    '+212634567891',
    CURRENT_DATE - INTERVAL '8 years',
    'Female',
    '123 Street, Casablanca, Morocco',
    CURRENT_DATE - INTERVAL '1 year',
    'DEVELOPMENT',
    'LEFT',
    'Fatima Hassan',
    '+212612345679',
    u.id,
    12,
    'MIDFIELDER',
    TRUE,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'parent1@batal.com'
ON CONFLICT DO NOTHING;

-- PART 5: Create test children for parent2 (Karim Benali)
-- Child 1: Omar Benali (12 years old)
INSERT INTO players (
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    joining_date,
    level,
    basic_foot,
    emergency_contact_name,
    emergency_contact_phone,
    parent_id,
    player_number,
    position,
    is_active,
    created_at,
    updated_at
)
SELECT
    'Omar',
    'Benali',
    'omar.benali@family.com',
    '+212645678901',
    CURRENT_DATE - INTERVAL '12 years',
    'Male',
    '456 Avenue, Rabat, Morocco',
    CURRENT_DATE - INTERVAL '3 years',
    'ADVANCED',
    'RIGHT',
    'Laila Benali',
    '+212623456790',
    u.id,
    10,
    'DEFENDER',
    TRUE,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'parent2@batal.com'
ON CONFLICT DO NOTHING;

-- PART 6: Validation and reporting
DO $$
DECLARE
    parent_count INTEGER;
    children_count INTEGER;
    parent1_children INTEGER;
    parent2_children INTEGER;
BEGIN
    SELECT COUNT(*) INTO parent_count FROM users WHERE user_type = 'PARENT';
    SELECT COUNT(*) INTO children_count FROM players WHERE parent_id IS NOT NULL;

    SELECT COUNT(*) INTO parent1_children
    FROM players p
    JOIN users u ON p.parent_id = u.id
    WHERE u.email = 'parent1@batal.com';

    SELECT COUNT(*) INTO parent2_children
    FROM players p
    JOIN users u ON p.parent_id = u.id
    WHERE u.email = 'parent2@batal.com';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration V34 Completed';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total parent users: %', parent_count;
    RAISE NOTICE 'Total players with parents: %', children_count;
    RAISE NOTICE 'Parent1 (parent1@batal.com) children: %', parent1_children;
    RAISE NOTICE 'Parent2 (parent2@batal.com) children: %', parent2_children;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test Credentials:';
    RAISE NOTICE '  Parent 1: parent1@batal.com / parent123 (2 children: Youssef, Sara)';
    RAISE NOTICE '  Parent 2: parent2@batal.com / parent123 (1 child: Omar)';
    RAISE NOTICE '========================================';
END $$;
