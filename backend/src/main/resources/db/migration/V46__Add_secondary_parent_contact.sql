-- Secondary parent as a contact on the parent account, not an account itself.
--
-- A family may have a second parent whose email and phone are optional. Users
-- cannot express that as an account: users.email is NOT NULL UNIQUE because it
-- is the login identity. So the second parent is stored as plain contact
-- details, with no account and no way to log in.
--
-- These live on the main parent rather than on each player because they
-- describe the family. Storing them per player would duplicate them across
-- siblings, and would leave nowhere to put them when editing a parent who has
-- no players yet.
--
-- The main parent is still a real User linked to players through
-- player_parents, which stays a many-to-many so one parent can hold several
-- children.

ALTER TABLE users
    ADD COLUMN secondary_parent_name  VARCHAR(200),
    ADD COLUMN secondary_parent_email VARCHAR(255),
    ADD COLUMN secondary_parent_phone VARCHAR(20);

COMMENT ON COLUMN users.secondary_parent_name IS
    'Second parent/guardian contact name. No user account is created for them.';
COMMENT ON COLUMN users.secondary_parent_email IS
    'Optional. Contact only - never used to log in, so it is not unique.';
COMMENT ON COLUMN users.secondary_parent_phone IS
    'Optional contact number for the second parent.';

-- Email and phone only make sense alongside a name.
ALTER TABLE users
    ADD CONSTRAINT chk_secondary_parent_named
    CHECK (
        secondary_parent_name IS NOT NULL
        OR (secondary_parent_email IS NULL AND secondary_parent_phone IS NULL)
    );
