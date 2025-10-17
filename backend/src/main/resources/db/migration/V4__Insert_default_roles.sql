-- Insert default roles (removed PLAYER role)
INSERT INTO roles (name, description) VALUES 
    ('COACH', 'Coach with access to manage assigned groups and create assessments'),
    ('ADMIN', 'Administrator with user management and system configuration access'),
    ('MANAGER', 'Manager with academy-wide analytics and all administrative permissions');
