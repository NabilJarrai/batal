-- V22: Fix parent_name column length to match entity expectation
-- Change parent_name from VARCHAR(200) to VARCHAR(255) for consistency

ALTER TABLE players ALTER COLUMN parent_name TYPE VARCHAR(255);
