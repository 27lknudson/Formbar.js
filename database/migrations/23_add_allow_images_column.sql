-- 23_add_allow_images_column.sql
-- This migration adds a new column to the poll_history table to store whether images were allowed in poll responses.
-- This is necessary to preserve the full state of past polls when they are archived.

-- This will fail if the migration has already been run (column already exists)
ALTER TABLE poll_history ADD COLUMN allowImagesInResponses INTEGER NOT NULL DEFAULT 0;