-- Neutralize the accounts seeded with passwords published in this repository.
--
-- V5, V24 and V34/V35 insert users whose passwords appear in plain text in the
-- migration comments (admin123, coach123, parent123). Those migrations run in
-- every environment, so any deployment built from them ships with publicly
-- known credentials -- including an administrator.
--
-- Rows are matched on the seeded password hash rather than on the email
-- address. If somebody has since changed the password, the account is in real
-- use and is left untouched.

DO $neutralize$
DECLARE
    -- The exact hashes written by V5, V24, V34 and V35.
    seeded_hashes TEXT[] := ARRAY[
        '$2a$10$yrLhDZnlTr.XG1Oc22CIh.zYfqIIuFcHuacC5/DCqIrbbg9WRXJB.', -- V5  admin@batal.com  (admin123)
        '$2a$10$5JTJMJz.qXr1vT1yJYvFOe5xPWCX5wKgYv8u4mMFJGm.fYqrhVWNu', -- V24 coach@batal.com
        '$2a$10$N9qo8uLOickgx2ZMRZoMye7Mx/KPM2J5M3r3L3XgJxGPJx8YJ5EJu', -- V34 parent1/parent2 (superseded by V35)
        '$2a$10$/NBqXsvgsxMjMpkWds03cO.g755fvQpzqcHYc0jXchXzYpgujXOSm'  -- V35 parent1/parent2 (parent123)
    ];

    -- Not a BCrypt hash, so no password can ever match it.
    disabled_password CONSTANT TEXT := 'DISABLED-SEEDED-ACCOUNT-NO-LOGIN-POSSIBLE';

    -- chk_inactive_reason requires a reason whenever an account with a password
    -- set is deactivated.
    disabled_reason CONSTANT TEXT :=
        'Seeded test account disabled by V47: its password was published in the repository';

    real_admins INT;
    neutralized INT;
    admin_left  INT;
BEGIN
    -- Administrators whose password is NOT one of the seeded ones, i.e. real
    -- accounts someone actually controls.
    SELECT count(DISTINCT u.id) INTO real_admins
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
     WHERE r.name = 'ADMIN'
       AND u.is_active = true
       AND NOT (u.password = ANY(seeded_hashes));

    -- Non-admin seeded accounts are pure test data: always safe to disable.
    UPDATE users
       SET password = disabled_password,
           is_active = false,
           inactive_reason = disabled_reason,
           updated_at = now()
     WHERE password = ANY(seeded_hashes)
       AND id NOT IN (
             SELECT ur.user_id FROM user_roles ur
               JOIN roles r ON r.id = ur.role_id
              WHERE r.name = 'ADMIN'
       );
    GET DIAGNOSTICS neutralized = ROW_COUNT;

    IF real_admins > 0 THEN
        -- Another administrator exists, so retiring the seeded one cannot lock
        -- anybody out.
        UPDATE users
           SET password = disabled_password,
               is_active = false,
               inactive_reason = disabled_reason,
               updated_at = now()
         WHERE password = ANY(seeded_hashes);
        GET DIAGNOSTICS admin_left = ROW_COUNT;
        neutralized := neutralized + admin_left;
    ELSE
        -- Deliberately left alone. Disabling it would leave no way into the
        -- system at all, and failing the migration would block every future
        -- deploy. Warn loudly instead; see the note at the foot of this file.
        SELECT count(*) INTO admin_left
          FROM users WHERE password = ANY(seeded_hashes);

        IF admin_left > 0 THEN
            RAISE WARNING 'V47: % seeded ADMIN account(s) still use a password published in this repository. They were NOT disabled because no other active administrator exists and doing so would lock everyone out. Create an administrator with a password of your own, then disable them by hand.', admin_left;
        END IF;
    END IF;

    -- Any outstanding setup or reset links for those accounts are now moot.
    UPDATE password_tokens
       SET used_at = now()
     WHERE used_at IS NULL
       AND user_id IN (SELECT id FROM users WHERE password = disabled_password);

    RAISE NOTICE 'V47: neutralized % seeded account(s).', neutralized;
END
$neutralize$;

-- If the warning above fired, finish the job once you have your own admin:
--
--   UPDATE users SET password = 'DISABLED-SEEDED-ACCOUNT-NO-LOGIN-POSSIBLE',
--                    is_active = false, updated_at = now()
--    WHERE email = 'admin@batal.com';
