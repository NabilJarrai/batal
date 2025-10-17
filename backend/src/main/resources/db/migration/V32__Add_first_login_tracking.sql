-- Add first login tracking to users table
-- This enables detection of first-time logins for mandatory password changes

ALTER TABLE users
ADD COLUMN first_login_at TIMESTAMP;

-- Add comment to document the purpose
COMMENT ON COLUMN users.first_login_at IS 'Timestamp when user logged in for the first time and changed their default password. NULL indicates user has not completed first login flow.';