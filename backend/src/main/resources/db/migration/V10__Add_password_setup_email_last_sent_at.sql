-- Add timestamp field to track when password setup email was last sent
-- Used for rate limiting resend requests (5-minute cooldown)
ALTER TABLE users ADD COLUMN password_setup_email_last_sent_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN users.password_setup_email_last_sent_at IS 'Timestamp when password setup email was last sent. Used for rate limiting (5-minute cooldown between resend requests)';
