-- Migration V36: Convert from one-to-many to many-to-many parent-child relationship
-- This allows a child (player) to have multiple parents (mother and father)

-- PART 1: Create the junction table
CREATE TABLE IF NOT EXISTS player_parents (
    player_id BIGINT NOT NULL,
    parent_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, parent_id),
    CONSTRAINT fk_player_parents_player
        FOREIGN KEY (player_id)
        REFERENCES players(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_player_parents_parent
        FOREIGN KEY (parent_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- PART 2: Migrate existing parent_id data to junction table
-- Only migrate non-null parent_id values
INSERT INTO player_parents (player_id, parent_id)
SELECT id, parent_id
FROM players
WHERE parent_id IS NOT NULL;

-- PART 3: Create index for performance (lookup by parent_id)
CREATE INDEX idx_player_parents_parent_id ON player_parents(parent_id);
CREATE INDEX idx_player_parents_player_id ON player_parents(player_id);

-- PART 4: Drop the old parent_id column from players table
-- Note: We keep this for now to avoid breaking existing code during transition
-- Will be removed in a future migration after all code is updated
-- ALTER TABLE players DROP COLUMN parent_id;

-- PART 5: Validation and reporting
DO $$
DECLARE
    junction_count INTEGER;
    players_with_parents INTEGER;
    parents_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO junction_count FROM player_parents;

    SELECT COUNT(DISTINCT player_id) INTO players_with_parents FROM player_parents;

    SELECT COUNT(DISTINCT parent_id) INTO parents_count FROM player_parents;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration V36 Completed';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Junction table created: player_parents';
    RAISE NOTICE 'Total parent-child relationships: %', junction_count;
    RAISE NOTICE 'Players with at least one parent: %', players_with_parents;
    RAISE NOTICE 'Total parents: %', parents_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Note: parent_id column kept in players table for backwards compatibility';
    RAISE NOTICE 'It will be removed in a future migration';
    RAISE NOTICE '========================================';
END $$;
