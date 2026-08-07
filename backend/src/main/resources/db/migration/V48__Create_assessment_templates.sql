-- Assessment templates: a named, curated set of skills assigned to a group.
--
-- Until now the skills a player was scored on were derived automatically from
-- their level, so everyone at a level got the same list. A template lets an
-- admin choose exactly which skills apply to a group.
--
-- This is NOT the same thing as the assessments table, which stores a single
-- player's scored evaluation on a date. A template is the blueprint; an
-- assessment is the filled-in result. They are kept apart so that editing a
-- template never rewrites history.
--
-- Age and level are deliberately absent here. Both already describe the group,
-- and a template reaches players only by being assigned to one.

CREATE TABLE assessment_templates (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Titles are how an admin picks a template from a list, so duplicates
    -- would make the choice ambiguous.
    CONSTRAINT uq_assessment_template_title UNIQUE (title)
);

COMMENT ON TABLE assessment_templates IS
    'A titled set of skills that defines what a group''s players are assessed on.';

-- The skills making up a template. Scoring lists them in the library's own
-- order, so a skill sits in the same place across every template and no
-- per-template ordering is stored here.
CREATE TABLE assessment_template_skills (
    template_id BIGINT NOT NULL,
    skill_id    BIGINT NOT NULL,

    PRIMARY KEY (template_id, skill_id),
    CONSTRAINT fk_template_skills_template FOREIGN KEY (template_id)
        REFERENCES assessment_templates (id) ON DELETE CASCADE,
    -- A skill that is part of a template cannot be deleted out from under it.
    CONSTRAINT fk_template_skills_skill FOREIGN KEY (skill_id)
        REFERENCES skills (id) ON DELETE RESTRICT
);

CREATE INDEX idx_template_skills_template ON assessment_template_skills (template_id);
CREATE INDEX idx_template_skills_skill    ON assessment_template_skills (skill_id);

-- A group has at most one template. Assessments for its players are blocked
-- until one is assigned, so this stays nullable rather than defaulting to
-- something arbitrary.
ALTER TABLE groups
    ADD COLUMN assessment_template_id BIGINT;

ALTER TABLE groups
    ADD CONSTRAINT fk_groups_assessment_template FOREIGN KEY (assessment_template_id)
        REFERENCES assessment_templates (id) ON DELETE RESTRICT;

CREATE INDEX idx_groups_assessment_template ON groups (assessment_template_id);

COMMENT ON COLUMN groups.assessment_template_id IS
    'Which template defines the skills this group''s players are assessed on. '
    'Null means assessments cannot be created for them yet.';
