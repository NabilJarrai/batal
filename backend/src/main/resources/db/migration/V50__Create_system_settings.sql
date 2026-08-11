-- Academy-wide switches an admin can flip at runtime, without a redeploy.
--
-- Deliberately key/value rather than one column per switch: these are rare,
-- unrelated toggles, and a new one should not cost a migration.

CREATE TABLE system_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    BIGINT       REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE system_settings IS 'Runtime academy-wide settings, keyed by name. Values are stored as text and parsed by SystemSettingService.';
COMMENT ON COLUMN system_settings.updated_by IS 'Admin who last changed the value. Null if the row is a seeded default or that admin has since been deleted.';

-- Seeded ON so deploying this migration changes nothing about how the academy
-- already behaves. An admin pauses it from the dashboard before a bulk intake,
-- then resumes once there is something worth logging in to see.
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('parent_welcome_emails_enabled', 'true');
