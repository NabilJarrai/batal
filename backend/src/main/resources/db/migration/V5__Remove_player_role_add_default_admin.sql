-- Remove PLAYER role and create default admin user

-- First, remove any user_roles relationships with PLAYER role
DELETE FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'PLAYER');

-- Remove PLAYER role
DELETE FROM roles WHERE name = 'PLAYER';

-- Insert default admin user (password is 'admin123' hashed with BCrypt)
INSERT INTO users (email, password, first_name, last_name, is_active, created_at, updated_at) 
VALUES (
    'admin@batal.com', 
    '$2a$10$yrLhDZnlTr.XG1Oc22CIh.zYfqIIuFcHuacC5/DCqIrbbg9WRXJB.', 
    'Admin', 
    'User', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
);

-- Assign ADMIN role to the default admin user
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
    u.id, 
    r.id, 
    CURRENT_TIMESTAMP
FROM users u, roles r 
WHERE u.email = 'admin@batal.com' 
AND r.name = 'ADMIN';
