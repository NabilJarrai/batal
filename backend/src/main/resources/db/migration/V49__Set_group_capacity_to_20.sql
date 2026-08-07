-- Standard group size is 20 players, up from 15.
--
-- Capacity stays a per-group column rather than a system-wide constant, so a
-- group can still be deliberately smaller or larger. This only moves the
-- default and brings existing groups in line.
--
-- The limit is a prompt threshold, not a hard rule: an admin who fills a group
-- is offered the choice of adding anyway or splitting the group, so going over
-- is possible but never silent.

-- Only groups still on the old default. A capacity someone deliberately set to
-- something else is left alone.
UPDATE groups
   SET capacity = 20,
       updated_at = CURRENT_TIMESTAMP
 WHERE capacity = 15;

ALTER TABLE groups
    ALTER COLUMN capacity SET DEFAULT 20;

COMMENT ON COLUMN groups.capacity IS
    'Standard size is 20. Exceeded only when an admin explicitly chooses to '
    'over-fill the group rather than split it.';
